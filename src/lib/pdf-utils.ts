import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Regex to match modern CSS color functions unsupported by html2canvas
const UNSUPPORTED_COLOR_RE = /oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)|color\([^)]*\)/gi;

/**
 * Checks if a CSS value contains any unsupported modern color function.
 */
function hasUnsupportedColor(value: string): boolean {
  return /oklch|oklab|\blab\(|\blch\(|\bcolor\(/i.test(value);
}

/**
 * Generates a PDF from an HTML element, handling common issues like modern CSS
 * color functions (oklch, oklab, lab, lch, color()) that html2canvas cannot parse.
 * Uses jsPDF's html method for reliable multi-page layouts.
 */
export async function generatePDF(element: HTMLElement, filename: string) {
  // Use jsPDF's built-in html method which is much better at handling page breaks
  // than manual image slicing.
  const pdf = new jsPDF("p", "mm", "a4");

  const originalStyle = element.getAttribute("style");

  try {
    // PRE-PROCESSING: Fix ALL unsupported modern color functions for html2canvas
    // Tailwind 4 uses oklch AND oklab extensively; html2canvas supports neither.
    const allElements = element.querySelectorAll("*");
    const elementsToRestore: Array<{ el: HTMLElement, style: string | null }> = [];

    // Add the root element to the list
    elementsToRestore.push({ el: element, style: element.getAttribute("style") });

    // Function to check and fix colors
    const fixColor = (el: HTMLElement) => {
      const computedStyle = window.getComputedStyle(el);
      const properties = ["color", "backgroundColor", "borderColor", "borderTopColor", "borderBottomColor", "borderLeftColor", "borderRightColor", "outlineColor", "fill", "stroke", "textDecorationColor", "boxShadow", "caretColor"];

      let needsFix = false;
      const savedStyle = el.getAttribute("style") || "";

      properties.forEach(prop => {
        const cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
        const value = (el.style as any)[prop] || computedStyle.getPropertyValue(cssProp);
        if (value && hasUnsupportedColor(value)) {
          needsFix = true;
          if (prop.toLowerCase().includes("background")) {
            el.style.setProperty(cssProp, "#ffffff", "important");
          } else if (prop.toLowerCase().includes("shadow")) {
            el.style.setProperty(cssProp, "none", "important");
          } else {
            el.style.setProperty(cssProp, "#000000", "important");
          }
        }
      });

      if (needsFix) {
        elementsToRestore.push({ el, style: savedStyle });
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

      // Timeout after 30 seconds to prevent permanent hanging
      const timeout = setTimeout(() => {
        reject(new Error("PDF generation timed out. The document might be too large."));
      }, 30000);

      pdf.html(element, {
        callback: (doc) => {
          clearTimeout(timeout);
          try {
            // Restore original styles
            element.style.width = originalWidth;
            element.style.minWidth = originalMinWidth;

            // Direct download is more reliable than window.open which is often blocked
            doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
            resolve(true);
          } catch (err) {
            reject(err);
          }
        },
        x: 0,
        y: 0,
        width: 210, // Full A4 width in mm
        windowWidth: windowWidth,
        autoPaging: 'text',
        margin: [0, 0, 0, 0],
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById(element.id) || clonedDoc.body.firstChild as HTMLElement;
            if (clonedElement) {
              clonedElement.style.width = "794px";
              clonedElement.style.minWidth = "794px";
            }

            // Sanitize ALL stylesheets: replace oklch, oklab, lab, lch, color()
            const styles = clonedDoc.querySelectorAll("style");
            styles.forEach(styleEl => {
              if (hasUnsupportedColor(styleEl.innerHTML)) {
                styleEl.innerHTML = styleEl.innerHTML.replace(UNSUPPORTED_COLOR_RE, "#000000");
              }
            });

            // Also fix computed styles on every element in the clone
            const allCloned = clonedDoc.querySelectorAll("*");
            allCloned.forEach(el => fixColor(el as HTMLElement));
          }
        }
      }).catch(err => {
        clearTimeout(timeout);
        reject(err);
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
