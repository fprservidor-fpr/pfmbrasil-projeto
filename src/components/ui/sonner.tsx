"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-zinc-900/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border-zinc-800/50 group-[.toaster]:shadow-[0_0_30px_rgba(0,0,0,0.5)] group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:border group-[.toaster]:shadow-emerald-500/10",
          description: "group-[.toast]:text-zinc-400 group-[.toast]:text-xs font-medium",
          actionButton: "group-[.toast]:bg-emerald-600 group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:rounded-xl",
          cancelButton: "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-400 group-[.toast]:font-bold group-[.toast]:rounded-xl",
          success: "group-[.toaster]:border-emerald-500/50 group-[.toaster]:shadow-emerald-500/20 group-[.toaster]:bg-emerald-950/20",
          error: "group-[.toaster]:border-red-500/50 group-[.toaster]:shadow-red-500/20 group-[.toaster]:bg-red-950/20",
          info: "group-[.toaster]:border-blue-500/50 group-[.toaster]:shadow-blue-500/20 group-[.toaster]:bg-blue-950/20",
          warning: "group-[.toaster]:border-amber-500/50 group-[.toaster]:shadow-amber-500/20 group-[.toaster]:bg-amber-950/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
