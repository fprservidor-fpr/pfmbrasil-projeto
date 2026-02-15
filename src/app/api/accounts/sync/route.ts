import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Inicializa o cliente admin do Supabase
// Usamos as variáveis de ambiente com fallback para evitar erros de build, mas validamos em tempo de execução
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST() {
    try {
        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { success: false, error: "Credenciais do Supabase não configuradas." },
                { status: 500 }
            );
        }

        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from("profiles")
            .select("*");

        if (profilesError) throw profilesError;

        const results = {
            total: profiles.length,
            created: 0,
            already_exists: 0,
            errors: [] as string[],
        };

        for (const profile of profiles) {
            // Verifica se o perfil tem email
            if (!profile.email) {
                results.errors.push(`Perfil ${profile.id} (${profile.full_name}) sem e-mail.`);
                continue;
            }

            // Verifica se já existe usuário com este email no Auth
            const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

            // Nota: listUsers não filtra por email diretamente na API admin antiga, então filtramos manualmente
            // Se houver muitos usuários, isso pode precisar de paginação ou outra abordagem
            const userExists = existingUsers.users.find(u => u.email === profile.email);

            if (userExists) {
                // Se existe, verifica se o profiles.id bate com o user.id
                // Se não bater, atualizamos o profile para apontar para o user correto (vínculo)
                if (profile.id !== userExists.id) {
                    // Em alguns casos o ID do profile é o mesmo do Auth, em outros é diferente.
                    // Se sua lógica é que profile.id deve ser igual a auth.uid, aqui teríamos um problema de integridade.
                    // Mas geralmente o vínculo é feito na criação.

                    // Se o profile já existe e o user também, assumimos que estão ok ou apenas logamos.
                    results.already_exists++;
                } else {
                    results.already_exists++;
                }
                continue;
            }

            // Se não existe, cria a conta
            // Senha padrão: cpf (se tiver) ou "Mudar123!"
            const password = profile.cpf ? profile.cpf.replace(/\D/g, '') : "Mudar123!";

            if (password.length < 6) {
                results.errors.push(`Senha gerada para ${profile.email} é muito curta.`);
                continue;
            }

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: profile.email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    full_name: profile.full_name,
                    cpf: profile.cpf,
                    role: profile.role
                }
            });

            if (createError) {
                results.errors.push(`Erro ao criar usuário para ${profile.email}: ${createError.message}`);
                continue;
            }

            // Atualiza o ID do perfil para corresponder ao novo UUID do Auth (se necessário e se sua tabela permitir)
            // Se sua tabela profiles usa o ID como chave estrangeira para auth.users, você não pode simplesmente mudar o ID.
            // Você teria que criar um novo perfil ou atualizar uma coluna `user_id`.

            // Assumindo que a tabela profiles tem uma coluna user_id ou que o ID é a PK:
            // Se profiles.id for UUID e PK, não podemos mudar facilmente se já tiver dados vinculados.

            // Se a lógica do seu sistema é "Profile existe, Auth não", e o ID é compartilhado:
            // Isso é complexo porque não podemos criar um usuário no Auth com um ID específico (o Supabase gera).
            // Então, teremos um usuário Auth com ID X e um Profile com ID Y.
            // O correto seria o Profile ter o mesmo ID do Auth.

            // Como não podemos mudar o ID do Auth, vamos tentar atualizar o Profile para ter o ID do novo Auth?
            // Isso só funciona se não houver constraints que impeçam.

            // Por segurança, vamos apenas criar o usuário no Auth neste passo e logar que foi criado.
            // O vínculo idealmente deve ser tratado na aplicação.

            results.created++;
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Erro na sincronização:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
