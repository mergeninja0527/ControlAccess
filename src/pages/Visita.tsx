import { 
  IonButton, 
  IonContent, 
  IonDatetime, 
  IonIcon, 
  IonInput, 
  IonLoading, 
  IonModal, 
  IonPage, 
  IonSelect, 
  IonSelectOption, 
  IonTextarea,
  useIonRouter,
  useIonToast 
} from "@ionic/react";
import { useRef, useState, useEffect } from "react";
import { formatearRut, handleRutDown } from "../../utils/RutFormatter";
import { useForm } from "react-hook-form";
import moment from "moment";
import { arrowBack, calendarOutline, logoWhatsapp, mailOutline, downloadOutline, chevronDown } from "ionicons/icons";
import { useAppSelector } from "../../hooks/loginHooks";
import httpClient from "../../hooks/CapacitorClient";
import { validateEmail, validateNombre, validateTelefono, validateRut } from "../../utils/Validators";
import { QRCodeSVG } from 'qrcode.react';
import '../../assets/Visita.css';

interface Campos {
  rut: string;
  name: string;
  email: string;
  telefono: string;
}

const Visita: React.FC = () => {
  const router = useIonRouter();
  const { user, unidades: unidadesFromRedux } = useAppSelector((state) => state.login);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [accessCode, setAccessCode] = useState<string>('');
  const [invitationData, setInvitationData] = useState<{nombre: string, fechaFin: string} | null>(null);
  const [unidades, setUnidades] = useState<Array<{value: number | string, label: string}>>([]);
  const form = useForm();
  const modalInicio = useRef<HTMLIonModalElement>(null);
  const modalFin = useRef<HTMLIonModalElement>(null);
  const [toast] = useIonToast();
  const initDate = moment();
  const [fechaInicio, setFechaInicio] = useState<string | string[] | null | undefined>(initDate.format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaFin, setFechaFin] = useState<string | string[] | null | undefined>(initDate.add(2, "days").format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaMin] = useState(moment().format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaMax] = useState(moment().add(2, 'weeks').format("yyyy-MM-DDTHH:mm:ss"));

  // Fetch unidades on component mount
  useEffect(() => {
    const fetchUnidades = async () => {
      // First, try to use unidades from Redux if available
      if (unidadesFromRedux && unidadesFromRedux.length > 0) {
        const mappedUnidades = unidadesFromRedux.map((u: any) => ({ 
          value: typeof u.value === 'string' ? parseInt(u.value) || u.value : u.value, 
          label: u.label 
        }));
        console.log('[Visita] Using unidades from Redux:', mappedUnidades);
        setUnidades(mappedUnidades);
        return;
      }
      
      // Otherwise, fetch from API
      try {
        console.log('[Visita] Fetching unidades from API...');
        const response = await httpClient.get('/mobile/unidades');
        console.log('[Visita] Unidades API response:', response.data);
        
        if (response.data?.success && response.data?.data && response.data.data.length > 0) {
          console.log('[Visita] Setting unidades from API:', response.data.data);
          setUnidades(response.data.data);
        } else if (response.data?.data && response.data.data.length > 0) {
          // Fallback: if success flag is missing but data exists
          console.log('[Visita] Setting unidades from API (fallback):', response.data.data);
          setUnidades(response.data.data);
        } else {
          console.warn('[Visita] No unidades found in API response');
        }
      } catch (error: any) {
        console.error('[Visita] Error fetching unidades:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
        console.error('[Visita] Error details:', errorMsg);
      }
    };
    
    fetchUnidades();
  }, [unidadesFromRedux]);

  const showToast = (message: string, color: 'warning' | 'danger' | 'success' = "success") => {
    toast({
      message,
      duration: 1500,
      swipeGesture: "vertical",
      position: "top",
      color,
      buttons: [{ text: "✖", role: "cancel" }]
    });
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      router.push('/home', 'back', 'pop');
    }
  };

  const handleContinue = async () => {
    const formValues = form.getValues();
    const { rut, name, email, telefono, nroUnidad, rol, motivo } = formValues;

    // Validate all required fields are present
    if (!rut || rut.trim() === '') {
      return showToast("El RUT es requerido.", "warning");
    }
    
    if (!name || name.trim() === '') {
      return showToast("El nombre completo es requerido.", "warning");
    }
    
    if (!email || email.trim() === '') {
      return showToast("El correo electrónico es requerido.", "warning");
    }
    
    if (!telefono || telefono.trim() === '') {
      return showToast("El teléfono es requerido.", "warning");
    }
    
    if (!nroUnidad) {
      return showToast("La unidad es requerida.", "warning");
    }
    
    if (!rol) {
      return showToast("El rol es requerido.", "warning");
    }
    
    if (!fechaInicio || fechaInicio === "") {
      return showToast("La fecha de inicio es requerida.", "warning");
    }

    if (!fechaFin || fechaFin === "") {
      return showToast("La fecha de término es requerida.", "warning");
    }

    // Validate RUT format
    const rutValidation = validateRut(rut);
    if (!rutValidation.valid) {
      return showToast(rutValidation.message || "RUT inválido.", "warning");
    }

    // Validate email format
    if (!validateEmail(email)) {
      return showToast("Formato de correo electrónico inválido.", "warning");
    }

    // Validate name format
    const nombreValidation = validateNombre(name);
    if (!nombreValidation.valid) {
      return showToast(nombreValidation.message || "Nombre inválido.", "warning");
    }

    // Validate phone format
    const telefonoValidation = validateTelefono(telefono);
    if (!telefonoValidation.valid) {
      return showToast(telefonoValidation.message || "Teléfono inválido.", "warning");
    }

    // Validate dates
    const fi = moment(fechaInicio);
    const ff = moment(fechaFin);
    
    if (ff.isBefore(fi)) {
      return showToast("La fecha de término debe ser posterior a la fecha de inicio.", "warning");
    }
    
    if (fi.isBefore(moment(), 'day')) {
      return showToast("La fecha de inicio no puede ser anterior a hoy.", "warning");
    }

    // Check if RUT exists and validate user data consistency
    try {
      const normalizedRut = rut.replace(/\./g, '').trim();
      const userResponse = await httpClient.post('/mobile/get-user-by-rut', { rut: normalizedRut });
      
      if (userResponse.data?.success && userResponse.data?.exists) {
        const existingUser = userResponse.data.user;
        
        // Check if name, email, or phone don't match
        const nameMismatch = existingUser.nombre && existingUser.nombre.trim().toLowerCase() !== name.trim().toLowerCase();
        const emailMismatch = existingUser.correo && existingUser.correo.trim().toLowerCase() !== email.trim().toLowerCase();
        const phoneMismatch = existingUser.telefono && existingUser.telefono.trim() !== telefono.trim();
        
        if (nameMismatch || emailMismatch || phoneMismatch) {
          let mismatchFields = [];
          if (nameMismatch) mismatchFields.push('nombre');
          if (emailMismatch) mismatchFields.push('correo');
          if (phoneMismatch) mismatchFields.push('teléfono');
          
          return showToast(
            `El RUT ya está registrado, pero los datos no coinciden: ${mismatchFields.join(', ')}. Por favor, verifique la información.`,
            "warning"
          );
        }
      }
    } catch (error) {
      console.error('[Visita] Error checking user:', error);
      // Continue anyway - backend will also validate
    }

    // All validations passed, proceed with invitation creation
    try {
      setLoading(true);
      const fi = moment(fechaInicio).format("yyyy-MM-DD HH:mm:ss");
      const ff = moment(fechaFin).format("yyyy-MM-DD HH:mm:ss");
      const normalizedUser = user?.replace(/\./g, '') || '';
      const normalizedRut = rut.replace(/\./g, '').trim();
      
      // Use new invitations API
      const response = await httpClient.post('/invitations', {
        createdBy: normalizedUser,
        nombreInvitado: name.trim(),
        rutInvitado: normalizedRut,
        correoInvitado: email.trim(),
        telefonoInvitado: telefono.trim(),
        motivo: motivo || '',
        fechaInicio: fi,
        fechaFin: ff,
        idSala: nroUnidad,
        usageLimit: 1
      });
        
        console.log('[Visita] Response:', response);
        
        if (response.status === 403) return showToast(response.data?.message || 'Error', "danger");

        if (response.data?.success && response.data?.data?.idAcceso) {
          // Set access code and invitation data first
          setAccessCode(response.data.data.idAcceso);
          setInvitationData({
            nombre: name.trim(),
            fechaFin: ff
          });
          
          // Move to step 2 immediately - QR will render instantly
          setCurrentStep(2);
          showToast("Invitación generada correctamente.", "success");
        } else {
          showToast("Error al generar la invitación.", "danger");
        }
    } catch (error: any) {
      console.error('[Visita] Error:', error);
      const errorMessage = error.response?.data?.message || "Ocurrió algún error al crear la invitación.";
      showToast(errorMessage, "danger");
    } finally {
      setLoading(false);
    }
  };

  const qrCodeRef = useRef<HTMLDivElement>(null);

  const generateQRAsImage = async (): Promise<string> => {
    if (!accessCode) return Promise.resolve('');
    
    // Wait a tiny bit to ensure SVG is rendered (only if needed)
    let svg = qrCodeRef.current?.querySelector('svg');
    if (!svg) {
      // Give it a moment to render
      await new Promise(resolve => setTimeout(resolve, 50));
      svg = qrCodeRef.current?.querySelector('svg');
    }
    
    if (svg) {
      return convertSVGToPNG(svg);
    }
    
    // If still no SVG, generate directly (shouldn't happen normally)
    return generateQRDirectly(accessCode);
  };

  const convertSVGToPNG = async (svg: SVGElement): Promise<string> => {
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    
    const img = new Image();
    const ctx = canvas.getContext('2d');
    
    try {
      return await new Promise<string>((resolve, reject) => {
        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            const dataUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(dataUrl);
          } else {
            URL.revokeObjectURL(url);
            reject(new Error('Could not get canvas context'));
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load SVG'));
        };
        img.src = url;
      });
    } catch {
      return '';
    }
  };

  const generateQRDirectly = async (code: string): Promise<string> => {
    // Fallback: create QR code SVG directly (should rarely be needed)
    // Use a simpler approach - just return empty if QR component isn't available
    // The QR should always be rendered in the UI before download/share is called
    console.warn('[Visita] QR SVG not found, cannot generate image');
    return '';
  };

  const handleShareWhatsApp = async () => {
    if (!accessCode) {
      showToast("No hay QR disponible para compartir", "warning");
      return;
    }

    try {
      // Generate QR code as image (no delay needed - QR is already rendered)
      const qrImageData = await generateQRAsImage();
      
      if (!qrImageData) {
        showToast("Error al generar QR", "danger");
        return;
      }

      // Convert base64 to blob
      const base64Data = qrImageData.replace(/^data:image\/\w+;base64,/, "");
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link and download
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-invitacion-${invitationData?.nombre || 'invitacion'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Open WhatsApp with message
      const message = encodeURIComponent(
        `Hola! Te invito a acceder. Presenta este código QR en la entrada.\n` +
        `Válido hasta: ${invitationData?.fechaFin ? moment(invitationData.fechaFin).format('DD/MM/YYYY HH:mm') : ''}`
      );
      const whatsappUrl = `https://wa.me/?text=${message}`;
      window.open(whatsappUrl, '_blank');
      
      showToast("QR compartido por WhatsApp", "success");
    } catch (error) {
      console.error('[Visita] Error sharing via WhatsApp:', error);
      showToast("Error al compartir por WhatsApp", "danger");
    }
  };

  const handleShareEmail = async () => {
    if (!accessCode || !invitationData) {
      showToast("No hay datos disponibles para compartir", "warning");
      return;
    }

    try {
      // Generate QR code as image (no delay needed - QR is already rendered)
      const qrImageData = await generateQRAsImage();
      
      if (!qrImageData) {
        showToast("Error al generar QR", "danger");
        return;
      }

      const subject = encodeURIComponent('Invitación de Acceso');
      const body = encodeURIComponent(
        `Hola,\n\n` +
        `Has recibido una invitación de acceso.\n\n` +
        `Nombre: ${invitationData.nombre}\n` +
        `Válido hasta: ${moment(invitationData.fechaFin).format('DD/MM/YYYY HH:mm')}\n\n` +
        `Presenta el código QR adjunto en la entrada.\n\n` +
        `Saludos.`
      );
      
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;
      
      showToast("Abriendo cliente de correo...", "success");
    } catch (error) {
      console.error('[Visita] Error sharing via email:', error);
      showToast("Error al compartir por email", "danger");
    }
  };

  const handleDownloadQR = async () => {
    if (!accessCode) {
      showToast("No hay QR disponible para descargar", "warning");
      return;
    }

    try {
      // Generate QR code as image (no delay needed - QR is already rendered)
      const qrImageData = await generateQRAsImage();
      
      if (!qrImageData) {
        showToast("Error al generar QR", "danger");
        return;
      }

      // Convert base64 to blob
      const base64Data = qrImageData.replace(/^data:image\/\w+;base64,/, "");
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link and download
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-invitacion-${invitationData?.nombre || 'invitacion'}-${moment().format('YYYYMMDD')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("QR descargado correctamente", "success");
    } catch (error) {
      console.error('[Visita] Error downloading QR:', error);
      showToast("Error al descargar QR", "danger");
    }
  };

  const keyDown = (e: React.KeyboardEvent<HTMLIonInputElement>) => {
    const allowedControlKeys = [
      'Backspace',
      'Tab',
      'Delete',
      'ArrowLeft',
      'Home',
      'End',
      'ArrowRight'
    ];
    if (!/^[0-9]$/.test(e.key) && !allowedControlKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="visita-content">
        <IonLoading spinner="circles" isOpen={loading} onDidDismiss={() => setLoading(false)} />
        
        <div className="visita-container">
          {/* Header with back button */}
          <div className="visita-header">
            <button className="back-button" onClick={handleBack}>
              <IonIcon icon={arrowBack} />
              <span>Volver al Inicio</span>
            </button>
          </div>

          {/* Content */}
          <div className="visita-content-area">
            {/* Title */}
            <h1 className="visita-title">Invitar</h1>

            {/* Step Indicator */}
            <div className="step-indicator">
              <div className="step-labels">
                <span 
                  className={`step-label ${currentStep === 1 ? '' : 'inactive'} clickable`}
                  onClick={() => setCurrentStep(1)}
                >
                  1. Completa con los datos
                </span>
                <span 
                  className={`step-label ${currentStep === 2 ? '' : 'inactive'} clickable`}
                  onClick={() => setCurrentStep(2)}
                >
                  2. Comparte el QR
                </span>
              </div>
              <div className="step-progress-bar">
                <div className={`step-progress-segment ${currentStep >= 1 ? 'active' : ''}`}></div>
                <div className={`step-progress-segment ${currentStep >= 2 ? 'active' : ''}`}></div>
              </div>
            </div>

            {/* Step 1: Form */}
            {currentStep === 1 && (
              <div className="visita-form">
                {/* Rut */}
                <IonInput
                  className="visita-input"
                  placeholder="RUT (ej: 12.345.678-9)"
                  onKeyDown={handleRutDown}
                  {...form.register("rut", { 
                    onChange: (e) => { form.setValue('rut', formatearRut(e.target.value)) } 
                  })}
                  autocomplete="off"
                />

                {/* Nombre Completo */}
                <IonInput
                  className="visita-input"
                  placeholder="Nombre Completo"
                  {...form.register("name")}
                  autocomplete="off"
                />

                {/* Correo Electrónico */}
                <IonInput
                  className="visita-input"
                  placeholder="Correo Electrónico"
                  type="email"
                  {...form.register("email")}
                  autocomplete="off"
                />

                {/* Teléfono */}
                <IonInput
                  className="visita-input"
                  placeholder="Teléfono"
                  maxlength={9}
                  onKeyDown={(e) => keyDown(e)}
                  {...form.register("telefono")}
                  autocomplete="off"
                />

                {/* Rol and Nº de Unidad - Row */}
                <div className="form-row">
                  <IonSelect
                    className="visita-select"
                    placeholder="Rol"
                    interface="popover"
                    toggleIcon={chevronDown}
                    {...form.register("rol")}
                  >
                    <IonSelectOption value="VIS">Visita</IonSelectOption>
                    <IonSelectOption value="PRO">Proveedor</IonSelectOption>
                    <IonSelectOption value="TRA">Trabajador</IonSelectOption>
                  </IonSelect>

                  <IonSelect
                    className="visita-select"
                    placeholder={unidades && unidades.length > 0 ? "Nº de Unidad" : "Cargando unidades..."}
                    interface="popover"
                    toggleIcon={chevronDown}
                    disabled={!unidades || unidades.length === 0}
                    {...form.register("nroUnidad")}
                  >
                    {(unidades && unidades.length > 0) ? (
                      unidades.map(({ value, label }) => (
                        <IonSelectOption key={`${label}_${value}`} value={value}>
                          {label}
                        </IonSelectOption>
                      ))
                    ) : (
                      <IonSelectOption value="" disabled>
                        No hay unidades disponibles
                      </IonSelectOption>
                    )}
                  </IonSelect>
                </div>

                {/* Inicio and Fin - Row */}
                <div className="form-row">
                  <div className="date-input-wrapper">
                    <IonInput
                      className="visita-input"
                      placeholder="Inicio"
                      value={fechaInicio ? moment(fechaInicio).format("DD/MM/YYYY") : ''}
                      readonly
                      onClick={() => modalInicio.current?.present()}
                    />
                    <IonIcon icon={calendarOutline} className="date-icon" />
                  </div>

                  <div className="date-input-wrapper">
                    <IonInput
                      className="visita-input"
                      placeholder="Fin"
                      value={fechaFin ? moment(fechaFin).format("DD/MM/YYYY") : ''}
                      readonly
                      onClick={() => modalFin.current?.present()}
                    />
                    <IonIcon icon={calendarOutline} className="date-icon" />
                  </div>
                </div>

                {/* Date Modals */}
                <IonModal ref={modalInicio} className="date-modal">
                  <IonDatetime
                    style={{ margin: "0 auto" }}
                    showDefaultButtons={true}
                    presentation="date"
                    onIonChange={(e) => setFechaInicio(e.detail.value)}
                    min={fechaMin}
                    max={fechaMax}
                    value={fechaInicio}
                  />
                </IonModal>

                <IonModal ref={modalFin} className="date-modal">
                  <IonDatetime
                    style={{ margin: "0 auto" }}
                    showDefaultButtons={true}
                    presentation="date"
                    onIonChange={(e) => setFechaFin(e.detail.value)}
                    min={fechaMin}
                    max={fechaMax}
                    value={fechaFin}
                  />
                </IonModal>

                {/* Motivo de Ingreso */}
                <IonTextarea
                  className="visita-textarea"
                  placeholder="Motivo de Ingreso"
                  rows={4}
                  {...form.register("motivo")}
                />

                {/* Submit Button */}
                <IonButton 
                  expand="block" 
                  className="visita-submit-button"
                  onClick={handleContinue}
                >
                  Continuar
                </IonButton>
              </div>
            )}

            {/* Step 2: QR Code Sharing */}
            {currentStep === 2 && (
              <div className="qr-share-section">
                {/* QR Code */}
                <div className="qr-code-container" ref={qrCodeRef}>
                  {accessCode ? (
                    <QRCodeSVG 
                      value={accessCode} 
                      size={256}
                      level="M"
                      includeMargin={true}
                    />
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      Cargando QR...
                    </div>
                  )}
                </div>

                {/* Invitation Info */}
                {invitationData && (
                  <div className="invitation-info">
                    <p className="invitation-name">{invitationData.nombre}</p>
                    <p className="invitation-validity">
                      Válido hasta: {moment(invitationData.fechaFin).format('DD/MM/YYYY HH:mm')}
                    </p>
                  </div>
                )}

                {/* Share Buttons */}
                <div className="share-buttons-row">
                  <button className="share-button whatsapp" onClick={handleShareWhatsApp}>
                    <IonIcon icon={logoWhatsapp} />
                  </button>
                  <button className="share-button email" onClick={handleShareEmail}>
                    <IonIcon icon={mailOutline} />
                  </button>
                </div>

                {/* Download QR Link */}
                <button className="download-qr-link" onClick={handleDownloadQR}>
                  <IonIcon icon={downloadOutline} />
                  <span>Descargar QR</span>
                </button>

                {/* View All Invitations */}
                <button 
                  className="view-invitations-link" 
                  onClick={() => router.push('/invitations', 'forward', 'push')}
                >
                  Ver todas mis invitaciones
                </button>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Visita;
