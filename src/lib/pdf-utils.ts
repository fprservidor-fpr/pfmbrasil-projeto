import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Generates a PDF from an HTML element, handling common issues like oklch colors
 * and iframe rendering in certain environments.
 * Improved to handle multi-page layouts more reliably by using jsPDF's html method.
 */
export async function generatePDF(element: HTMLElement, filename: string) {
  // Use jsPDF's built-in html method which is much better at handling page breaks
  // than manual image slicing.
  const pdf = new jsPDF("p", "mm", "a4");
  
  const originalStyle = element.getAttribute("style");
  
  try {
    // PRE-PROCESSING: Fix unsupported oklch colors for html2canvas
    // This is a common issue with Tailwind 4 and modern CSS
    const allElements = element.querySelectorAll("*");
    const elementsToRestore: Array<{ el: HTMLElement, style: string | null }> = [];
    
    // Add the root element to the list
    elementsToRestore.push({ el: element, style: element.getAttribute("style") });
    
    // Function to check and fix colors
    const fixColor = (el: HTMLElement) => {
      const computedStyle = window.getComputedStyle(el);
      const properties = ["color", "backgroundColor", "borderColor", "borderTopColor", "borderBottomColor", "borderLeftColor", "borderRightColor", "outlineColor", "fill", "stroke"];
      
      let needsFix = false;
      let inlineStyle = el.getAttribute("style") || "";
      
      properties.forEach(prop => {
        const value = (el.style as any)[prop] || computedStyle.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
        if (value && value.includes("oklch")) {
          needsFix = true;
          // Replace oklch with a safe fallback (white or black depending on property)
          // Since we're printing to PDF, white background and black text is usually safe
          if (prop.toLowerCase().includes("background")) {
            el.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), "#ffffff", "important");
          } else {
            el.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), "#000000", "important");
          }
        }
      });
      
      if (needsFix) {
        elementsToRestore.push({ el, style: inlineStyle });
      }
    };

    // Apply fixes
    fixColor(element);
    allElements.forEach(el => fixColor(el as HTMLElement));

      // Ensure background is white for the PDF
      element.style.setProperty("background-color", "#ffffff", "important");
      element.style.setProperty("color", "#000000", "important");
      
      // Force A4 width in pixels to ensure consistent scaling
      const originalWidth = element.style.width;
      const originalMinWidth = element.style.minWidth;
      const originalPosition = element.style.position;
      const originalLeft = element.style.left;
      
      element.style.setProperty("width", "794px", "important");
      element.style.setProperty("min-width", "794px", "important");

      await new Promise((resolve, reject) => {
        // For A4 (210mm), we use 794px width (A4 at 96dpi) for a 1:1 pixel-to-mm ratio
        const windowWidth = 794; 
        
        pdf.html(element, {
          callback: (doc) => {
            // Restore original styles
            element.style.width = originalWidth;
            element.style.minWidth = originalMinWidth;
            
            // Open in a new tab instead of downloading
            window.open(doc.output('bloburl'), '_blank');
            resolve(true);
          },
          x: 0,
          y: 0,
          width: 210, // Full A4 width in mm
          windowWidth: windowWidth,
          autoPaging: 'text',
          margin: [0, 0, 0, 0], // Margins should be handled by the HTML content for better control
          html2canvas: {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            onclone: (clonedDoc) => {
              // Ensure the cloned element also has the fixed width
              const clonedElement = clonedDoc.getElementById(element.id) || clonedDoc.body.firstChild as HTMLElement;
              if (clonedElement) {
                clonedElement.style.width = "794px";
                clonedElement.style.minWidth = "794px";
              }

              const styles = clonedDoc.querySelectorAll("style");
            styles.forEach(style => {
              if (style.innerHTML.includes("oklch")) {
                style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, "#000000");
              }
            });
          }
        }
      });
    });

    // RESTORE: Put back original styles
    elementsToRestore.forEach(({ el, style }) => {
      if (style) {
        el.setAttribute("style", style);
      } else {
        el.removeAttribute("style");
      }
    });

    return true;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    // Fallback to the old method if html() fails
    return fallbackGeneratePDF(element, filename);
  } finally {
    if (originalStyle) {
      element.setAttribute("style", originalStyle);
    } else {
      element.removeAttribute("style");
    }
  }
}

/**
 * Fallback method using image slicing in case pdf.html fails
 */
async function fallbackGeneratePDF(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;
  
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;
  
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }
  
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  return true;
}
