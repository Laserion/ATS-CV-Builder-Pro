export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface CVData {
  name: string;
  photo: string | null;
  photoFrame: 'square' | 'round' | 'none';
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  hobbies: string[];
  presentation: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  leftPanelColor: string;
  leftPanelTextColor: string;
  templateId: string;
  fontFamily: 'sans' | 'serif' | 'mono' | 'outfit' | 'playfair' | 'grotesk';
}

export interface CoverLetterData {
  recipientName: string;
  companyName: string;
  content: string;
}
