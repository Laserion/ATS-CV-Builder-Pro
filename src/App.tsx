import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  FileText, 
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Heart,
  Palette,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CVData, Experience, Education, CoverLetterData } from './types';
import { optimizeForATS, generateCoverLetter } from './services/gemini';
import { cn } from './lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const initialCVData: CVData = {
  name: '',
  photo: null,
  photoFrame: 'round',
  contact: {
    email: '',
    phone: '',
    location: '',
    linkedin: '',
  },
  hobbies: [],
  presentation: '',
  experience: [],
  education: [],
  skills: [],
  leftPanelColor: '#1e293b', // slate-800
  leftPanelTextColor: '#ffffff',
  templateId: 'classic',
  fontFamily: 'sans',
};

export default function App() {
  const [cvData, setCvData] = useState<CVData>(initialCVData);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'cover-letter'>('edit');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [coverLetter, setCoverLetter] = useState<CoverLetterData>({
    recipientName: '',
    companyName: '',
    content: '',
  });
  const [jobDescription, setJobDescription] = useState('');
  
  // Persistence: Load data on mount
  useEffect(() => {
    const savedCVData = localStorage.getItem('ats-cv-builder-data');
    const savedCoverLetter = localStorage.getItem('ats-cv-builder-cover-letter');
    const savedJobDescription = localStorage.getItem('ats-cv-builder-job-desc');

    if (savedCVData) {
      try {
        setCvData(JSON.parse(savedCVData));
      } catch (e) {
        console.error("Error loading saved CV data", e);
      }
    }
    if (savedCoverLetter) {
      try {
        setCoverLetter(JSON.parse(savedCoverLetter));
      } catch (e) {
        console.error("Error loading saved cover letter", e);
      }
    }
    if (savedJobDescription) {
      setJobDescription(savedJobDescription);
    }
  }, []);

  // Persistence: Save data on changes
  useEffect(() => {
    localStorage.setItem('ats-cv-builder-data', JSON.stringify(cvData));
  }, [cvData]);

  useEffect(() => {
    localStorage.setItem('ats-cv-builder-cover-letter', JSON.stringify(coverLetter));
  }, [coverLetter]);

  useEffect(() => {
    localStorage.setItem('ats-cv-builder-job-desc', jobDescription);
  }, [jobDescription]);

  const previewRef = useRef<HTMLDivElement>(null);

  const resetData = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar todos los datos ingresados? Esta acción no se puede deshacer.")) {
      setCvData(initialCVData);
      setCoverLetter({
        recipientName: '',
        companyName: '',
        content: '',
      });
      setJobDescription('');
      localStorage.removeItem('ats-cv-builder-data');
      localStorage.removeItem('ats-cv-builder-cover-letter');
      localStorage.removeItem('ats-cv-builder-job-desc');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCvData({ ...cvData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
    };
    setCvData({ ...cvData, experience: [...cvData.experience, newExp] });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setCvData({
      ...cvData,
      experience: cvData.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    });
  };

  const removeExperience = (id: string) => {
    setCvData({ ...cvData, experience: cvData.experience.filter(exp => exp.id !== id) });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      year: '',
    };
    setCvData({ ...cvData, education: [...cvData.education, newEdu] });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setCvData({
      ...cvData,
      education: cvData.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    });
  };

  const removeEducation = (id: string) => {
    setCvData({ ...cvData, education: cvData.education.filter(edu => edu.id !== id) });
  };

  const handleOptimize = async () => {
    console.log("--- Iniciando Optimización ATS ---");
    if (!cvData.presentation) {
      console.log("Abortado: No hay texto en la presentación.");
      return;
    }
    
    setIsOptimizing(true);
    try {
      console.log("Llamando al servicio Gemini...");
      const optimized = await optimizeForATS(cvData.presentation, jobDescription);
      console.log("Respuesta recibida de Gemini.");
      if (optimized) {
        setCvData({ ...cvData, presentation: optimized });
      }
    } catch (error) {
      console.error("Fallo en handleOptimize:", error);
      alert(`Error de IA: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsOptimizing(false);
      console.log("--- Fin del proceso de optimización ---");
    }
  };

  const handleGenerateCoverLetter = async () => {
    console.log("--- Iniciando Generación de Carta ---");
    setIsOptimizing(true);
    try {
      const content = await generateCoverLetter(cvData, {
        recipient: coverLetter.recipientName,
        company: coverLetter.companyName,
        description: jobDescription
      });
      console.log("Carta generada con éxito.");
      setCoverLetter({ ...coverLetter, content: content || '' });
    } catch (error) {
      console.error("Fallo en handleGenerateCoverLetter:", error);
      alert(`Error al generar carta: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsOptimizing(false);
      console.log("--- Fin del proceso de carta ---");
    }
  };

  const exportToPDF = async () => {
    if (!previewRef.current) {
      alert("Error: No se encontró la vista previa.");
      return;
    }
    
    setIsExporting(true);
    
    // Store original styles to restore them later
    const originalStyle = previewRef.current.style.cssText;
    const parent = previewRef.current.parentElement;
    const originalParentStyle = parent ? parent.style.cssText : '';
    
    try {
      // Force visibility and remove height restrictions
      if (parent) {
        parent.style.display = 'block';
        parent.style.position = 'fixed';
        parent.style.left = '0';
        parent.style.top = '0';
        parent.style.width = '794px';
        parent.style.zIndex = '-9999';
        parent.style.visibility = 'visible';
        parent.style.opacity = '1';
      }

      previewRef.current.style.display = 'block';
      previewRef.current.style.position = 'relative';
      previewRef.current.style.left = '0';
      previewRef.current.style.top = '0';
      previewRef.current.style.width = '794px';
      previewRef.current.style.height = 'auto';
      previewRef.current.style.maxHeight = 'none';
      previewRef.current.style.overflow = 'visible';
      previewRef.current.style.minHeight = '0';
      previewRef.current.style.transform = 'none';

      // Ensure we are at the top of the page for capture
      window.scrollTo(0, 0);
      
      // Small delay to ensure any layout shifts are settled
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const scrollWidth = previewRef.current.scrollWidth || 794;
      const scrollHeight = previewRef.current.scrollHeight || 1122;

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: scrollHeight,
        windowWidth: 794,
        windowHeight: scrollHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const element = clonedDoc.getElementById('cv-preview');
          if (element) {
            element.style.display = 'block';
            element.style.position = 'static';
            element.style.width = '794px';
            element.style.margin = '0';
            element.style.padding = '0';
            element.style.boxShadow = 'none';
            element.style.border = 'none';
            element.style.borderRadius = '0';
            element.style.paddingBottom = '20px';
            
            // Ensure inner flex container has auto height
            const innerFlex = element.querySelector('.flex.h-full');
            if (innerFlex instanceof HTMLElement) {
              innerFlex.style.height = 'auto';
              innerFlex.style.minHeight = '0';
              innerFlex.style.width = '794px';
            }
            
            // Sanitize the element itself
            if (element.style.color?.includes('okl')) element.style.color = '#000000';
            if (element.style.backgroundColor?.includes('okl')) element.style.backgroundColor = '#ffffff';
            if (element.style.borderColor?.includes('okl')) element.style.borderColor = '#e5e5e5';
            
            // Add a style tag to the cloned document to override oklch/oklab colors
            // which html2canvas doesn't support yet.
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              * {
                color-scheme: light !important;
                text-rendering: optimizeLegibility !important;
                box-sizing: border-box !important;
              }
              .break-all, .break-words {
                line-height: 1.6 !important;
                padding-bottom: 4px !important;
                padding-top: 2px !important;
                padding-left: 1px !important;
                padding-right: 1px !important;
                display: block !important;
                height: auto !important;
                min-height: 1.5em !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
              }
              .flex.items-start, .flex.items-center {
                overflow: visible !important;
              }
              .shrink-0 {
                padding: 2px !important;
                overflow: visible !important;
                isolation: isolate !important;
                contain: paint !important;
                transform-style: preserve-3d !important;
                position: relative !important;
                box-decoration-break: clone !important;
                -webkit-box-decoration-break: clone !important;
              }
              svg {
                overflow: visible !important;
                margin: 4px !important;
                margin-top: -2px !important;
                padding-right: 2px !important;
                padding-bottom: 2px !important;
                padding-top: 2px !important;
                padding-left: 2px !important;
                display: inline-block !important;
                vertical-align: middle !important;
                stroke-width: 3 !important;
                shape-rendering: geometricPrecision !important;
                min-width: 18px !important;
                min-height: 18px !important;
                width: 18px !important;
                height: 18px !important;
                box-sizing: content-box !important;
                transform: translate3d(0,0,0) scale(1.1) !important;
                will-change: transform !important;
                backface-visibility: hidden !important;
                perspective: 1000px !important;
                image-rendering: -webkit-optimize-contrast !important;
                filter: drop-shadow(0 0 0.1px transparent) !important;
                pointer-events: none !important;
                user-select: none !important;
                speak: none !important;
                mix-blend-mode: normal !important;
                opacity: 0.99 !important;
                transform-origin: center center !important;
                flex-shrink: 0 !important;
                max-width: none !important;
                max-height: none !important;
                border: none !important;
                outline: none !important;
                background: transparent !important;
                box-shadow: none !important;
                z-index: 10 !important;
                clip-path: none !important;
                mask: none !important;
                text-indent: 0 !important;
                letter-spacing: normal !important;
                word-spacing: normal !important;
                text-transform: none !important;
                white-space: nowrap !important;
                text-shadow: none !important;
                font-size: 0 !important;
                font-style: normal !important;
                font-variant: normal !important;
                font-weight: normal !important;
                font-stretch: normal !important;
                font-family: sans-serif !important;
                line-height: 0 !important;
                color: inherit !important;
                fill: none !important;
                stroke: currentColor !important;
                stroke-linecap: round !important;
                stroke-linejoin: round !important;
                stroke-miterlimit: 10 !important;
                aspect-ratio: 1/1 !important;
              }
              svg * {
                vector-effect: non-scaling-stroke !important;
                stroke-opacity: 1 !important;
                fill-opacity: 0 !important;
                stroke-dasharray: none !important;
                stroke-dashoffset: 0 !important;
              }
              h3 {
                margin-top: 4px !important;
                margin-bottom: 4px !important;
              }
              h1 {
                margin-bottom: 8px !important;
              }
              p {
                margin-bottom: 4px !important;
              }
              /* Fallback for common Tailwind v4 oklch colors */
              .text-indigo-600 { color: #4f46e5 !important; }
              .bg-indigo-600 { background-color: #4f46e5 !important; }
              .border-indigo-600 { border-color: #4f46e5 !important; }
              .text-neutral-900 { color: #171717 !important; }
              .text-neutral-600 { color: #525252 !important; }
              .text-neutral-400 { color: #a3a3a3 !important; }
              .bg-neutral-100 { background-color: #f5f5f5 !important; }
              .border-neutral-200 { border-color: #e5e5e5 !important; }
              .border-neutral-100 { border-color: #f5f5f5 !important; }
            `;
            clonedDoc.head.appendChild(style);

            // More aggressive: Replace oklch/oklab in all style tags
            const styleTags = clonedDoc.getElementsByTagName('style');
            for (let i = 0; i < styleTags.length; i++) {
              const tag = styleTags[i];
              if (tag.innerHTML.includes('okl')) {
                tag.innerHTML = tag.innerHTML.replace(/oklch\([^)]+\)/g, '#4f46e5'); // Replace with indigo-600 hex
                tag.innerHTML = tag.innerHTML.replace(/oklab\([^)]+\)/g, '#4f46e5');
              }
            }

            // Fix for stretched photos in html2canvas: 
            // html2canvas doesn't support object-fit: cover well.
            // We convert <img> to background-images on their parents.
            const images = element.querySelectorAll('img');
            images.forEach((img: any) => {
              if (img.classList.contains('object-cover')) {
                const parent = img.parentElement;
                if (parent) {
                  parent.style.backgroundImage = `url(${img.src})`;
                  parent.style.backgroundSize = 'cover';
                  parent.style.backgroundPosition = 'center';
                  parent.style.backgroundRepeat = 'no-repeat';
                  parent.style.display = 'block';
                  img.style.opacity = '0';
                }
              }
            });

            // Defensive: Strip any oklch/oklab from computed styles in the clone
            const allElements = element.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const el = allElements[i] as HTMLElement;
              
              // Check inline styles
              if (el.style.color?.includes('okl')) el.style.color = '#000000';
              if (el.style.backgroundColor?.includes('okl')) el.style.backgroundColor = 'transparent';
              if (el.style.borderColor?.includes('okl')) el.style.borderColor = '#e5e5e5';
              
              // Also check for common attributes that might have colors
              if (el.getAttribute('fill')?.includes('okl')) el.setAttribute('fill', 'currentColor');
              if (el.getAttribute('stroke')?.includes('okl')) el.setAttribute('stroke', 'currentColor');

              // SVG specific
              if (el.tagName.toLowerCase() === 'svg') {
                if (el.style.fill?.includes('okl')) el.style.fill = 'currentColor';
                if (el.style.stroke?.includes('okl')) el.style.stroke = 'currentColor';
              }

              // Force some common properties to be hex if they are using oklch
              const computed = window.getComputedStyle(el);
              if (computed.color.includes('okl')) el.style.color = '#000000';
              if (computed.backgroundColor.includes('okl')) el.style.backgroundColor = 'transparent';
              if (computed.borderColor.includes('okl')) el.style.borderColor = '#e5e5e5';
            }
          }
        }
      });
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      if (!canvasWidth || !canvasHeight) {
        throw new Error("El canvas generado tiene dimensiones inválidas. Asegúrate de que la vista previa sea visible.");
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image height in mm to maintain aspect ratio based on 794px width
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(
        imgData, 
        'JPEG', 
        0, 
        position, 
        imgWidth, 
        imgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= pageHeight;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData, 
          'JPEG', 
          0, 
          position, 
          imgWidth, 
          imgHeight,
          undefined,
          'FAST'
        );
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${cvData.name.replace(/\s+/g, '_') || 'Curriculum'}.pdf`);

      // Export Cover Letter if it has content
      if (coverLetter.content && coverLetter.content.trim() !== "") {
        const clPdf = new jsPDF('p', 'mm', 'a4');
        clPdf.setFontSize(12);
        clPdf.text(cvData.name.toUpperCase(), 20, 20);
        clPdf.setFontSize(10);
        clPdf.text(`${cvData.contact.email} | ${cvData.contact.phone}`, 20, 28);
        clPdf.line(20, 32, 190, 32);
        
        clPdf.setFontSize(11);
        clPdf.text(`Para: ${coverLetter.recipientName || 'Reclutador'}`, 20, 45);
        clPdf.text(`Empresa: ${coverLetter.companyName || 'Empresa'}`, 20, 50);
        clPdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 55);
        
        const splitContent = clPdf.splitTextToSize(coverLetter.content, 170);
        clPdf.text(splitContent, 20, 70);
        
        clPdf.save(`${cvData.name.replace(/\s+/g, '_') || 'Curriculum'}_Carta_Presentacion.pdf`);
      }
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      // Restore original styles
      if (previewRef.current) {
        previewRef.current.style.cssText = originalStyle;
      }
      if (parent) {
        parent.style.cssText = originalParentStyle;
      }
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToWord = async () => {
    setIsExporting(true);
    try {
      const sections = [{
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Header: Name
          new Paragraph({
            children: [
              new TextRun({
                text: cvData.name.toUpperCase(),
                bold: true,
                size: 32,
                color: "171717",
              }),
            ],
            spacing: { after: 200 },
            alignment: AlignmentType.CENTER,
          }),
          
          // Contact Info Line
          new Paragraph({
            children: [
              new TextRun({ text: cvData.contact.email, size: 20 }),
              new TextRun({ text: " | ", size: 20 }),
              new TextRun({ text: cvData.contact.phone, size: 20 }),
              new TextRun({ text: " | ", size: 20 }),
              new TextRun({ text: cvData.contact.location, size: 20 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Profile Section
          new Paragraph({
            children: [new TextRun({ text: "PERFIL PROFESIONAL", bold: true, size: 24, color: "4f46e5" })],
            border: { bottom: { color: "e5e5e5", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: cvData.presentation, size: 22 })],
            spacing: { after: 300 },
          }),

          // Experience Section
          new Paragraph({
            children: [new TextRun({ text: "EXPERIENCIA LABORAL", bold: true, size: 24, color: "4f46e5" })],
            border: { bottom: { color: "e5e5e5", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 200, after: 100 },
          }),
          ...cvData.experience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ text: exp.position, bold: true, size: 22 }),
                new TextRun({ text: ` - ${exp.company}`, size: 22 }),
              ],
              spacing: { before: 150 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `${exp.startDate} - ${exp.endDate}`, size: 18, color: "737373", italics: true })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: exp.description, size: 20 })],
              spacing: { after: 200 },
            }),
          ]),

          // Education Section
          new Paragraph({
            children: [new TextRun({ text: "EDUCACIÓN", bold: true, size: 24, color: "4f46e5" })],
            border: { bottom: { color: "e5e5e5", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 200, after: 100 },
          }),
          ...cvData.education.flatMap(edu => [
            new Paragraph({
              children: [
                new TextRun({ text: edu.degree, bold: true, size: 22 }),
                new TextRun({ text: ` (${edu.year})`, size: 20, italics: true }),
              ],
              spacing: { before: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: edu.institution, size: 20, color: "525252" })],
              spacing: { after: 150 },
            }),
          ]),

          // Skills Section
          new Paragraph({
            children: [new TextRun({ text: "HABILIDADES", bold: true, size: 24, color: "4f46e5" })],
            border: { bottom: { color: "e5e5e5", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: cvData.skills.join(" • "), size: 20 })],
            spacing: { after: 200 },
          }),

          // Hobbies Section
          new Paragraph({
            children: [new TextRun({ text: "INTERESES", bold: true, size: 24, color: "4f46e5" })],
            border: { bottom: { color: "e5e5e5", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: cvData.hobbies.join(" • "), size: 20 })],
          }),
        ],
      }];

      // Add Cover Letter Section if it has content
      if (coverLetter.content && coverLetter.content.trim() !== "") {
        sections.push({
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: cvData.name.toUpperCase(), bold: true, size: 28 })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `${cvData.contact.email} | ${cvData.contact.phone}`, size: 18, color: "666666" })],
              spacing: { after: 400 },
              border: { bottom: { color: "e5e5e5", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Para: ${coverLetter.recipientName}`, bold: true, size: 20 })],
              spacing: { before: 200, after: 50 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Empresa: ${coverLetter.companyName}`, bold: true, size: 20 })],
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Fecha: ${new Date().toLocaleDateString()}`, size: 18 })],
              spacing: { after: 400 },
            }),
            ...coverLetter.content.split('\n').map(line => 
              new Paragraph({
                children: [new TextRun({ text: line, size: 22 })],
                spacing: { after: 100 },
              })
            ),
          ],
        });
      }

      const doc = new Document({ sections });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${cvData.name.replace(/\s+/g, '_') || 'Curriculum'}.docx`);
    } catch (error) {
      console.error("Error al exportar Word:", error);
      alert("Error al generar el archivo Word. Por favor, revisa que todos los campos estén completos.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <FileText size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ATS CV Builder</h1>
        </div>
        
        <nav className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('edit')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'edit' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Editor
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'preview' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Vista Previa
          </button>
          <button 
            onClick={() => setActiveTab('cover-letter')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'cover-letter' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Carta de Presentación
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isExporting ? <Sparkles size={18} className="animate-pulse" /> : <Download size={18} />}
            {isExporting ? 'Procesando...' : 'Exportar PDF'}
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <button 
            onClick={exportToWord}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <FileText size={18} />
            Word
          </button>
          <button 
            onClick={resetData}
            title="Borrar todos los datos"
            className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Side */}
        <div className={cn(
          "lg:col-span-5 space-y-8",
          activeTab === 'preview' ? "hidden lg:block" : "block"
        )}>
          {activeTab === 'edit' ? (
            <div className="space-y-8 pb-20">
              {/* Templates */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <FileText size={20} />
                  <h2>Plantillas ATS</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'classic', name: 'Clásica' },
                    { id: 'modern', name: 'Moderna' },
                    { id: 'executive', name: 'Ejecutiva' },
                    { id: 'minimal', name: 'Minimalista' },
                    { id: 'tech', name: 'Técnica' },
                    { id: 'uniform', name: 'Uniforme' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCvData({ ...cvData, templateId: t.id })}
                      className={cn(
                        "px-3 py-4 rounded-xl border text-xs font-bold transition-all",
                        cvData.templateId === t.id 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm" 
                          : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* Fonts */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <Palette size={20} />
                  <h2>Tipografía</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sans', name: 'Inter (Sans)', class: 'font-sans' },
                    { id: 'outfit', name: 'Outfit (Sans)', class: 'font-outfit' },
                    { id: 'grotesk', name: 'Grotesk (Tech)', class: 'font-grotesk' },
                    { id: 'serif', name: 'Baskerville (Serif)', class: 'font-serif' },
                    { id: 'playfair', name: 'Playfair (Serif)', class: 'font-playfair' },
                    { id: 'mono', name: 'JetBrains (Mono)', class: 'font-mono' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setCvData({ ...cvData, fontFamily: f.id as any })}
                      className={cn(
                        "py-2 rounded-lg border text-xs transition-all",
                        f.class,
                        cvData.fontFamily === f.id 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600" 
                          : "border-neutral-200 text-neutral-500"
                      )}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </section>
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <User size={20} />
                  <h2>Información Personal</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={cvData.name}
                      onChange={(e) => setCvData({ ...cvData, name: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Foto de Perfil</label>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors">
                          <ImageIcon size={20} />
                          <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                        </label>
                        {cvData.photo && (
                          <button 
                            onClick={() => setCvData({ ...cvData, photo: null })}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Marco de Foto</label>
                      <select 
                        value={cvData.photoFrame}
                        onChange={(e) => setCvData({ ...cvData, photoFrame: e.target.value as any })}
                        className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none"
                      >
                        <option value="round">Redondo</option>
                        <option value="square">Cuadrado</option>
                        <option value="none">Sin Marco</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Info */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <Mail size={20} />
                  <h2>Contacto</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={cvData.contact.email}
                      onChange={(e) => setCvData({ ...cvData, contact: { ...cvData.contact, email: e.target.value } })}
                      className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Teléfono</label>
                    <input 
                      type="tel" 
                      value={cvData.contact.phone}
                      onChange={(e) => setCvData({ ...cvData, contact: { ...cvData.contact, phone: e.target.value } })}
                      className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Ubicación</label>
                    <input 
                      type="text" 
                      value={cvData.contact.location}
                      onChange={(e) => setCvData({ ...cvData, contact: { ...cvData.contact, location: e.target.value } })}
                      className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">LinkedIn</label>
                    <input 
                      type="text" 
                      value={cvData.contact.linkedin}
                      onChange={(e) => setCvData({ ...cvData, contact: { ...cvData.contact, linkedin: e.target.value } })}
                      className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Presentation */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                    <Sparkles size={20} />
                    <h2>Presentación / Perfil</h2>
                  </div>
                  <button 
                    onClick={handleOptimize}
                    disabled={isOptimizing || !cvData.presentation}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isOptimizing ? 'Optimizando...' : 'Optimizar ATS'}
                  </button>
                </div>
                <textarea 
                  value={cvData.presentation}
                  onChange={(e) => setCvData({ ...cvData, presentation: e.target.value })}
                  rows={4}
                  maxLength={600}
                  placeholder="Describe tu perfil profesional (máx. 6 líneas)..."
                  className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none resize-none"
                />
                <div className="flex justify-end">
                  <span className={cn(
                    "text-[10px] font-medium",
                    cvData.presentation.length >= 550 ? "text-red-500" : "text-neutral-400"
                  )}>
                    {cvData.presentation.length}/600 caracteres
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Descripción del Puesto (Opcional para optimizar)</label>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={2}
                    placeholder="Pega aquí la descripción del trabajo para optimizar con palabras clave..."
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none text-sm"
                  />
                </div>
              </section>

              {/* Experience */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                    <Briefcase size={20} />
                    <h2>Experiencia Laboral</h2>
                  </div>
                  <button 
                    onClick={addExperience}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {cvData.experience.map((exp) => (
                    <div key={exp.id} className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-4 relative group">
                      <button 
                        onClick={() => removeExperience(exp.id)}
                        className="absolute top-4 right-4 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="Empresa"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-neutral-200 outline-none text-sm"
                        />
                        <input 
                          placeholder="Cargo"
                          value={exp.position}
                          onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-neutral-200 outline-none text-sm"
                        />
                        <input 
                          placeholder="Inicio (Mes/Año)"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-neutral-200 outline-none text-sm"
                        />
                        <input 
                          placeholder="Fin (Mes/Año o Actual)"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-neutral-200 outline-none text-sm"
                        />
                      </div>
                      <textarea 
                        placeholder="Descripción de logros y responsabilidades..."
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 outline-none text-sm resize-none"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Education */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                    <GraduationCap size={20} />
                    <h2>Educación</h2>
                  </div>
                  <button 
                    onClick={addEducation}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {cvData.education.map((edu) => (
                    <div key={edu.id} className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 grid grid-cols-1 md:grid-cols-3 gap-3 relative group">
                      <button 
                        onClick={() => removeEducation(edu.id)}
                        className="absolute -top-2 -right-2 p-1 bg-white border border-neutral-200 rounded-full text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                      <input 
                        placeholder="Institución"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-neutral-200 outline-none text-sm"
                      />
                      <input 
                        placeholder="Título"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-neutral-200 outline-none text-sm"
                      />
                      <input 
                        placeholder="Año"
                        value={edu.year}
                        onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-neutral-200 outline-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Skills & Hobbies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                    <Wrench size={20} />
                    <h2>Habilidades</h2>
                  </div>
                  <input 
                    placeholder="Ej. React, Python, Liderazgo (separar por comas)"
                    value={cvData.skills.join(", ")}
                    onChange={(e) => setCvData({ ...cvData, skills: e.target.value.split(",").map(s => s.trim()) })}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none"
                  />
                </section>
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                    <Heart size={20} />
                    <h2>Hobbies</h2>
                  </div>
                  <input 
                    placeholder="Ej. Fotografía, Viajes (separar por comas)"
                    value={cvData.hobbies.join(", ")}
                    onChange={(e) => setCvData({ ...cvData, hobbies: e.target.value.split(",").map(h => h.trim()) })}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none"
                  />
                </section>
              </div>

              {/* Appearance */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <Palette size={20} />
                  <h2>Diseño</h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Color Panel Izquierdo</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={cvData.leftPanelColor}
                        onChange={(e) => setCvData({ ...cvData, leftPanelColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border-none cursor-pointer"
                      />
                      <span className="text-sm font-mono text-neutral-500 uppercase">{cvData.leftPanelColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Color Texto Panel Izquierdo</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={cvData.leftPanelTextColor}
                        onChange={(e) => setCvData({ ...cvData, leftPanelTextColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border-none cursor-pointer"
                      />
                      <span className="text-sm font-mono text-neutral-500 uppercase">{cvData.leftPanelTextColor}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : activeTab === 'cover-letter' ? (
            <div className="space-y-8">
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <FileText size={20} />
                  <h2>Generar Carta de Presentación</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Nombre del Reclutador</label>
                      <input 
                        type="text" 
                        value={coverLetter.recipientName}
                        onChange={(e) => setCoverLetter({ ...coverLetter, recipientName: e.target.value })}
                        placeholder="Ej. Sr. Martínez"
                        className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Empresa</label>
                      <input 
                        type="text" 
                        value={coverLetter.companyName}
                        onChange={(e) => setCoverLetter({ ...coverLetter, companyName: e.target.value })}
                        placeholder="Ej. Tech Solutions"
                        className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Descripción del Puesto (Para personalizar la carta)</label>
                    <textarea 
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={3}
                      placeholder="Pega aquí la descripción del trabajo para que la IA personalice mejor la carta..."
                      className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none text-sm resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={handleGenerateCoverLetter}
                      disabled={isOptimizing || !cvData.name}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md"
                    >
                      <Sparkles size={18} />
                      {isOptimizing ? 'Generando...' : 'Generar con IA'}
                    </button>
                    {!cvData.name && (
                      <p className="text-[10px] text-amber-600 text-center font-medium">
                        * Completa tu nombre en la pestaña "Editor" para habilitar la generación con IA.
                      </p>
                    )}
                  </div>

                  <textarea 
                    value={coverLetter.content}
                    onChange={(e) => setCoverLetter({ ...coverLetter, content: e.target.value })}
                    rows={15}
                    className="w-full px-4 py-4 rounded-xl border border-neutral-200 outline-none font-serif text-neutral-800 leading-relaxed"
                  />
                </div>
              </section>
            </div>
          ) : null}
        </div>

        {/* Preview Side */}
        <div className={cn(
          "lg:col-span-7",
          activeTab === 'edit' || activeTab === 'cover-letter' ? "hidden lg:block" : "block"
        )}>
          <div className="sticky top-24">
            <div 
              className={cn(
                "bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden min-h-[1122px] w-full max-w-[794px] mx-auto",
                cvData.fontFamily === 'sans' ? 'font-sans' : 
                cvData.fontFamily === 'serif' ? 'font-serif' : 
                cvData.fontFamily === 'mono' ? 'font-mono' :
                cvData.fontFamily === 'outfit' ? 'font-outfit' :
                cvData.fontFamily === 'playfair' ? 'font-playfair' : 'font-grotesk'
              )} 
              id="cv-preview" 
              ref={previewRef}
            >
              <div className={cn(
                "flex h-full min-h-[1122px]",
                cvData.templateId === 'tech' || cvData.templateId === 'uniform' ? 'flex-col' : 'flex-row'
              )}>
                {/* Left Panel / Top Panel for Uniform */}
                <div 
                  className={cn(
                    "p-8 flex flex-col gap-8 transition-all duration-300",
                    cvData.templateId === 'classic' ? 'w-[30%]' : 
                    cvData.templateId === 'modern' ? 'w-[25%] border-r border-neutral-100' :
                    cvData.templateId === 'executive' ? 'w-[35%]' : 
                    cvData.templateId === 'minimal' ? 'w-[30%] border-r border-neutral-100' :
                    cvData.templateId === 'tech' ? 'w-full flex-row justify-between items-start border-b border-neutral-100' : 
                    cvData.templateId === 'uniform' ? 'w-full bg-white border-b border-neutral-100' : 'w-[30%]'
                  )}
                  style={{ 
                    backgroundColor: cvData.templateId === 'uniform' ? '#ffffff' : cvData.leftPanelColor, 
                    color: cvData.templateId === 'uniform' ? '#171717' : cvData.leftPanelTextColor 
                  }}
                >
                  <div className={cn(
                    "flex flex-col gap-8",
                    cvData.templateId === 'tech' || cvData.templateId === 'uniform' ? 'flex-row items-center justify-between w-full' : ''
                  )}>
                    {/* Photo & Name for Uniform */}
                    <div className={cn(
                      "flex items-center gap-6",
                      cvData.templateId === 'uniform' ? '' : 'hidden'
                    )}>
                      {cvData.photo && (
                        <div className={cn(
                          "w-32 h-32 overflow-hidden border-2 border-neutral-100 shadow-sm",
                          cvData.photoFrame === 'round' ? "rounded-full" : 
                          cvData.photoFrame === 'square' ? "rounded-none" : "rounded-xl"
                        )}>
                          <img src={cvData.photo} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <h1 className="text-2xl font-black tracking-tight uppercase text-neutral-900">{cvData.name || 'TU NOMBRE'}</h1>
                        <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
                      </div>
                    </div>

                    {/* Photo for others */}
                    {cvData.photo && cvData.templateId !== 'uniform' && (
                      <div className="flex justify-center shrink-0">
                        <div className={cn(
                          "w-32 h-32 overflow-hidden border-4 border-white shadow-lg",
                          cvData.photoFrame === 'round' ? "rounded-full" : 
                          cvData.photoFrame === 'square' ? "rounded-none" : "rounded-2xl"
                        )} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                          <img src={cvData.photo} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    <div className={cn(
                      "space-y-4",
                      cvData.templateId === 'uniform' ? 'text-right' : ''
                    )}>
                      <h3 className={cn(
                        "text-xs font-bold uppercase tracking-[0.2em] border-b pb-2",
                        cvData.templateId === 'uniform' ? 'border-neutral-100 text-neutral-400' : 'border-white/10 text-white/60'
                      )} style={{ 
                        borderBottomColor: cvData.templateId === 'uniform' ? '#f5f5f5' : 'rgba(255,255,255,0.1)', 
                        color: cvData.templateId === 'uniform' ? '#a3a3a3' : 'rgba(255,255,255,0.6)' 
                      }}>Contacto</h3>
                      <div className={cn(
                        "space-y-3 text-sm",
                        cvData.templateId === 'tech' || cvData.templateId === 'uniform' ? 'grid grid-cols-2 gap-x-8 gap-y-2 space-y-0' : ''
                      )}>
                        {cvData.contact.email && (
                          <div className={cn("flex items-start gap-3", cvData.templateId === 'uniform' ? 'justify-end' : '')}>
                            <Mail size={18} className="shrink-0 mt-1" style={{ color: cvData.templateId === 'uniform' ? '#6366f1' : 'rgba(255,255,255,0.6)' }} />
                            <div className="flex flex-col leading-relaxed gap-1 py-1">
                              <span className="break-all font-medium">{cvData.contact.email.split('@')[0]}</span>
                              {cvData.contact.email.includes('@') && (
                                <span className="text-[14px] break-all block" style={{ color: cvData.templateId === 'uniform' ? '#6366f1' : 'rgba(255,255,255,0.7)' }}>@{cvData.contact.email.split('@')[1]}</span>
                              )}
                            </div>
                          </div>
                        )}
                        {cvData.contact.phone && (
                          <div className={cn("flex items-center gap-3", cvData.templateId === 'uniform' ? 'justify-end' : '')}>
                            <Phone size={18} className="shrink-0" style={{ color: cvData.templateId === 'uniform' ? '#6366f1' : 'rgba(255,255,255,0.6)' }} />
                            <span>{cvData.contact.phone}</span>
                          </div>
                        )}
                        {cvData.contact.location && (
                          <div className={cn("flex items-center gap-3", cvData.templateId === 'uniform' ? 'justify-end' : '')}>
                            <MapPin size={18} className="shrink-0" style={{ color: cvData.templateId === 'uniform' ? '#6366f1' : 'rgba(255,255,255,0.6)' }} />
                            <span>{cvData.contact.location}</span>
                          </div>
                        )}
                        {cvData.contact.linkedin && (
                          <div className={cn("flex items-start gap-3", cvData.templateId === 'uniform' ? 'justify-end' : '')}>
                            <Linkedin size={18} className="shrink-0 mt-1" style={{ color: cvData.templateId === 'uniform' ? '#6366f1' : 'rgba(255,255,255,0.6)' }} />
                            <span className="break-all text-[11px] leading-relaxed">{cvData.contact.linkedin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hobbies for non-uniform */}
                  {cvData.templateId !== 'uniform' && cvData.hobbies.length > 0 && cvData.hobbies[0] !== "" && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-white pb-2" style={{ borderBottomColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>Intereses</h3>
                      <div className="flex flex-wrap gap-2">
                        {cvData.hobbies.map((hobby, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>{hobby}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Panel */}
                <div className={cn(
                  "p-10 bg-white space-y-10 transition-all duration-300",
                  cvData.templateId === 'classic' ? 'w-[70%]' : 
                  cvData.templateId === 'modern' ? 'w-[75%]' :
                  cvData.templateId === 'executive' ? 'w-[65%]' :
                  cvData.templateId === 'minimal' ? 'w-[70%]' :
                  cvData.templateId === 'tech' || cvData.templateId === 'uniform' ? 'w-full' : 'w-[70%]'
                )}>
                  {/* Header for non-uniform */}
                  {cvData.templateId !== 'uniform' && (
                    <div className={cn(
                      "space-y-2",
                      cvData.templateId === 'executive' ? 'text-center' : '',
                      cvData.templateId === 'minimal' ? 'border-l-4 border-indigo-600 pl-6' : ''
                    )}>
                      <h1 className={cn(
                        "font-black text-neutral-900 tracking-tight uppercase leading-none",
                        cvData.templateId === 'executive' ? 'text-5xl' : 'text-4xl'
                      )}>
                        {cvData.name || 'TU NOMBRE'}
                      </h1>
                      {cvData.templateId !== 'minimal' && (
                        <div className={cn(
                          "h-1.5 bg-indigo-600 rounded-full",
                          cvData.templateId === 'executive' ? 'w-32 mx-auto' : 'w-20'
                        )}></div>
                      )}
                    </div>
                  )}

                  {/* Presentation */}
                  {cvData.presentation && (
                    <div className={cn(
                      "space-y-3",
                      cvData.templateId === 'uniform' ? 'border-b border-neutral-100 pb-8' : ''
                    )}>
                      <h2 className={cn(
                        "text-sm font-bold uppercase tracking-[0.2em]",
                        cvData.templateId === 'tech' ? 'text-neutral-400' : 'text-indigo-600'
                      )}>Perfil Profesional</h2>
                      <p className={cn(
                        "text-neutral-600 text-sm leading-relaxed whitespace-pre-wrap",
                        cvData.templateId === 'tech' ? 'font-mono' : ''
                      )}>
                        {cvData.presentation}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {cvData.experience.length > 0 && (
                    <div className={cn(
                      "space-y-6",
                      cvData.templateId === 'uniform' ? 'border-b border-neutral-100 pb-8' : ''
                    )}>
                      <h2 className={cn(
                        "text-sm font-bold uppercase tracking-[0.2em]",
                        cvData.templateId === 'tech' ? 'text-neutral-400' : 'text-indigo-600'
                      )}>Experiencia Laboral</h2>
                      <div className="space-y-6">
                        {cvData.experience.map((exp) => (
                          <div key={exp.id} className={cn(
                            "space-y-2",
                            cvData.templateId === 'minimal' ? 'border-l border-neutral-100 pl-4' : ''
                          )}>
                            <div className="flex justify-between items-baseline">
                              <h3 className="font-bold text-neutral-800">{exp.position}</h3>
                              <span className="text-xs font-medium text-neutral-400 uppercase">{exp.startDate} — {exp.endDate}</span>
                            </div>
                            <div className="text-sm font-semibold text-indigo-500">{exp.company}</div>
                            <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {cvData.education.length > 0 && (
                    <div className={cn(
                      "space-y-6",
                      cvData.templateId === 'uniform' ? 'border-b border-neutral-100 pb-8' : ''
                    )}>
                      <h2 className={cn(
                        "text-sm font-bold uppercase tracking-[0.2em]",
                        cvData.templateId === 'tech' ? 'text-neutral-400' : 'text-indigo-600'
                      )}>Educación</h2>
                      <div className={cn(
                        "space-y-4",
                        cvData.templateId === 'tech' || cvData.templateId === 'uniform' ? 'grid grid-cols-2 gap-4 space-y-0' : ''
                      )}>
                        {cvData.education.map((edu) => (
                          <div key={edu.id} className="flex justify-between items-baseline">
                            <div>
                              <h3 className="font-bold text-neutral-800 text-sm">{edu.degree}</h3>
                              <div className="text-xs text-neutral-500">{edu.institution}</div>
                            </div>
                            <span className="text-xs font-medium text-neutral-400">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills & Hobbies for Uniform */}
                  {cvData.templateId === 'uniform' && (
                    <div className="grid grid-cols-2 gap-10">
                      {cvData.skills.length > 0 && cvData.skills[0] !== "" && (
                        <div className="space-y-4">
                          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Habilidades</h2>
                          <div className="flex flex-wrap gap-2">
                            {cvData.skills.map((skill, i) => (
                              <span key={i} className="px-3 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full border border-neutral-200">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {cvData.hobbies.length > 0 && cvData.hobbies[0] !== "" && (
                        <div className="space-y-4">
                          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Intereses</h2>
                          <div className="flex flex-wrap gap-2">
                            {cvData.hobbies.map((hobby, i) => (
                              <span key={i} className="px-3 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full border border-neutral-200">
                                {hobby}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skills for others */}
                  {cvData.templateId !== 'uniform' && cvData.skills.length > 0 && cvData.skills[0] !== "" && (
                    <div className="space-y-4">
                      <h2 className={cn(
                        "text-sm font-bold uppercase tracking-[0.2em]",
                        cvData.templateId === 'tech' ? 'text-neutral-400' : 'text-indigo-600'
                      )}>Habilidades</h2>
                      <div className="flex flex-wrap gap-2">
                        {cvData.skills.map((skill, i) => (
                          <span key={i} className={cn(
                            "px-3 py-1 text-xs font-medium",
                            cvData.templateId === 'tech' ? 'bg-neutral-900 text-white font-mono' : 'bg-neutral-100 text-neutral-700 rounded-full border border-neutral-200'
                          )}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, .lg\\:col-span-5, nav, button, .no-print { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; display: block !important; }
          .lg\\:col-span-7 { 
            display: block !important;
            width: 100% !important; 
            margin: 0 !important; 
            max-width: none !important; 
          }
          #cv-preview { 
            display: block !important;
            box-shadow: none !important; 
            border: none !important; 
            width: 100% !important; 
            max-width: none !important;
            min-height: 100vh !important;
            border-radius: 0 !important;
          }
          .sticky { position: static !important; }
        }
      `}} />
    </div>
  );
}
