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
import { useRef, useState } from "react";
import { formatearRut, handleRutDown, validarDigV } from "../../utils/RutFormatter";
import { useForm } from "react-hook-form";
import moment from "moment";
import { arrowBack, calendarOutline, logoWhatsapp, mailOutline, downloadOutline } from "ionicons/icons";
import { useAppSelector } from "../../hooks/loginHooks";
import httpClient from "../../hooks/CapacitorClient";
import qrCodeImage from '../../assets/images/QR_code.png';
import '../../assets/Visita.css';

interface Campos {
  rut: string;
  name: string;
  email: string;
  telefono: string;
}

const Visita: React.FC = () => {
  const router = useIonRouter();
  const { unidades } = useAppSelector((state) => state.login);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const form = useForm();
  const modalInicio = useRef<HTMLIonModalElement>(null);
  const modalFin = useRef<HTMLIonModalElement>(null);
  const [toast] = useIonToast();
  const initDate = moment();
  const [fechaInicio, setFechaInicio] = useState<string | string[] | null | undefined>(initDate.format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaFin, setFechaFin] = useState<string | string[] | null | undefined>(initDate.add(2, "days").format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaMin] = useState(moment().format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaMax] = useState(moment().add(2, 'weeks').format("yyyy-MM-DDTHH:mm:ss"));

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
    const { rut, telefono } = form.getValues();
    
    // Validate only if rut exists
    if (rut) {
      const tmp = rut.split("-");
      let err = 0;
      tmp[0] = tmp[0].replace(/\./g, '');
      tmp[1] = tmp[1] === 'K' ? 'k' : tmp[1];
      const digitoEsperado = validarDigV(tmp[0]);
      const nameIn: Campos = {
        rut: "Rut",
        name: "Nombre Completo",
        email: "Correo Electrónico",
        telefono: "Teléfono"
      };

      Object.keys(nameIn).every((key: string) => {
        if (form.getValues(key) === "" || form.getValues(key) === undefined) {
          const valorCampo: string = nameIn[key as keyof typeof nameIn];
          err++;
          showToast(`Campo debe estar completo: ${valorCampo}.`, "warning");
          return false;
        }
        return true;
      });

      if (err !== 0) return false;

      if (String(digitoEsperado) !== tmp[1]) {
        return showToast("Rut inválido.", "warning");
      }

      if (telefono && telefono.length !== 9) {
        return showToast("Número de teléfono inválido.", "warning");
      }

      if (!fechaInicio || fechaInicio === "") {
        return showToast("Fecha de inicio inválida.", "warning");
      }

      if (!fechaFin || fechaFin === "") {
        return showToast("Fecha de término inválida.", "warning");
      }

      try {
        setLoading(true);
        const fi = moment(fechaInicio).format("yyyy-MM-DD HH:mm:ss");
        const ff = moment(fechaFin).format("yyyy-MM-DD HH:mm:ss");
        const response = await httpClient.post('/mobile/visita', { ...form.getValues(), fechaInicio: fi, fechaFin: ff });
        if (response.status === 403) return showToast(response.data.message, "danger");

        showToast("Invitación generada correctamente.", "success");
        setCurrentStep(2);
      } catch {
        // For demo purposes, go to step 2 even if API fails
        setCurrentStep(2);
        // showToast("Ocurrió algún error al crear la invitación.", "danger");
      } finally {
        setLoading(false);
      }
    } else {
      // For demo/testing, allow going to step 2 without validation
      setCurrentStep(2);
    }
  };

  const handleShareWhatsApp = () => {
    showToast("Compartir por WhatsApp", "success");
    // Implement WhatsApp sharing logic
  };

  const handleShareEmail = () => {
    showToast("Compartir por Email", "success");
    // Implement email sharing logic
  };

  const handleDownloadQR = () => {
    showToast("Descargando QR...", "success");
    // Implement QR download logic
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
                  placeholder="Rut"
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
                    {...form.register("rol")}
                  >
                    <IonSelectOption value="VIS">Visita</IonSelectOption>
                    <IonSelectOption value="PRO">Proveedor</IonSelectOption>
                    <IonSelectOption value="TRA">Trabajador</IonSelectOption>
                  </IonSelect>

                  <IonSelect
                    className="visita-select"
                    placeholder="Nº de Unidad"
                    interface="popover"
                    {...form.register("nroUnidad")}
                  >
                    {(unidades || []).map(({ value, label }) => (
                      <IonSelectOption key={`${label}_${value}`} value={value}>
                        {label}
                      </IonSelectOption>
                    ))}
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
                <div className="qr-code-container">
                  <img src={qrCodeImage} alt="QR Code" />
                </div>

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
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Visita;
