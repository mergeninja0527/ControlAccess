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
  useIonRouter,
  useIonToast 
} from "@ionic/react";
import { useRef, useState } from "react";
import { formatearRut, handleRutDown, validarDigV } from "../../utils/RutFormatter";
import { validateEmail, validateNombre, validateTelefono, validateRutFormat } from "../../utils/Validators";
import { useForm } from "react-hook-form";
import moment from "moment";
import { arrowBack, calendarOutline, chevronDown } from "ionicons/icons";
import { useAppSelector } from "../../hooks/loginHooks";
import httpClient from "../../hooks/CapacitorClient";
import '../../assets/CreateUser.css';

interface Campos {
  rut: string;
  name: string;
  email: string;
  telefono: string;
}

const CreateUser: React.FC = () => {
  const router = useIonRouter();
  const { unidades } = useAppSelector((state) => state.login);
  const [loading, setLoading] = useState<boolean>(false);
  const form = useForm();
  const modalInicio = useRef<HTMLIonModalElement>(null);
  const modalFin = useRef<HTMLIonModalElement>(null);
  const [toast] = useIonToast();
  const initDate = moment();
  const [fechaInicio, setFechaInicio] = useState<string | string[] | null | undefined>(initDate.format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaFin, setFechaFin] = useState<string | string[] | null | undefined>(initDate.add(30, "days").format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaMin] = useState(moment().format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaMax] = useState(moment().add(1, 'year').format("yyyy-MM-DDTHH:mm:ss"));

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
    router.push('/home', 'back', 'pop');
  };

  const handleConfirm = async () => {
    const formValues = form.getValues();
    const { rut, name, email, telefono, rol, nroUnidad } = formValues;
    
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
    
    if (!rol) {
      return showToast("El rol es requerido.", "warning");
    }
    
    if (!nroUnidad) {
      return showToast("La unidad es requerida.", "warning");
    }

    // Validate RUT format
    const rutValidation = validateRutFormat(rut);
    if (!rutValidation.valid) {
      return showToast(rutValidation.message || "RUT inválido.", "warning");
    }

    // Validate RUT checksum
    const tmp = rut.split("-");
    tmp[0] = tmp[0].replace(/\./g, '');
    tmp[1] = tmp[1] === 'K' ? 'k' : tmp[1];
    const digitoEsperado = validarDigV(Number(tmp[0]));
    if (String(digitoEsperado) !== tmp[1]) {
      return showToast("RUT inválido. El dígito verificador no coincide.", "warning");
    }

    // Validate email format
    if (!validateEmail(email)) {
      return showToast("Formato de correo electrónico inválido.", "warning");
    }

    // Validate nombre format
    const nombreValidation = validateNombre(name);
    if (!nombreValidation.valid) {
      return showToast(nombreValidation.message || "Nombre inválido.", "warning");
    }

    // Validate telefono format
    const telefonoValidation = validateTelefono(telefono);
    if (!telefonoValidation.valid) {
      return showToast(telefonoValidation.message || "Teléfono inválido.", "warning");
    }

    // Validate dates
    if (!fechaInicio || fechaInicio === "") {
      return showToast("Fecha de inicio inválida.", "warning");
    }

    if (!fechaFin || fechaFin === "") {
      return showToast("Fecha de término inválida.", "warning");
    }

    // Check if RUT already exists
    try {
      setLoading(true);
      const normalizedRut = rut.replace(/\./g, '').trim();
      const rutCheckResponse = await httpClient.post('/mobile/check-rut', { rut: normalizedRut });
      
      if (rutCheckResponse.data?.exists) {
        setLoading(false);
        return showToast("El RUT ya está registrado.", "danger");
      }
    } catch (error) {
      console.error('[CreateUser] Error checking RUT:', error);
      // Continue anyway - backend will also check
    }

    // Submit form
    try {
      const fi = moment(fechaInicio).format("yyyy-MM-DD HH:mm:ss");
      const ff = moment(fechaFin).format("yyyy-MM-DD HH:mm:ss");
      const normalizedRut = rut.replace(/\./g, '').trim();
      
      const response = await httpClient.post('/mobile/createUser', { 
        rut: normalizedRut,
        nombre: name.trim(),
        correo: email.trim(),
        telefono: telefono.trim(),
        rol,
        sala: nroUnidad,
        fechaInicio: fi, 
        fechaFin: ff 
      });
      
      if (response.status === 403) {
        return showToast(response.data?.message || "Error al crear el usuario.", "danger");
      }

      showToast("Usuario creado correctamente.", "success");
      form.reset();
      setTimeout(() => {
        router.push('/home', 'back', 'pop');
      }, 1000);
    } catch (error: any) {
      console.error('[CreateUser] Error:', error);
      const errorMessage = error.response?.data?.message || "Ocurrió algún error al crear el usuario.";
      showToast(errorMessage, "danger");
    } finally {
      setLoading(false);
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
      <IonContent fullscreen className="createuser-content">
        <IonLoading spinner="circles" isOpen={loading} onDidDismiss={() => setLoading(false)} />
        
        <div className="createuser-container">
          {/* Header with back button */}
          <div className="createuser-header">
            <button className="createuser-back-button" onClick={handleBack}>
              <IonIcon icon={arrowBack} />
              <span>Volver al Inicio</span>
            </button>
          </div>

          {/* Content */}
          <div className="createuser-content-area">
            {/* Title */}
            <h1 className="createuser-title">Crear Usuario</h1>
            <p className="createuser-subtitle">Genera un nuevo usuario con tus mismos permisos.</p>

            {/* Form */}
            <div className="createuser-form">
              {/* Rut */}
              <IonInput
                className="createuser-input"
                placeholder="Rut"
                onKeyDown={handleRutDown}
                {...form.register("rut", { 
                  onChange: (e) => { form.setValue('rut', formatearRut(e.target.value)) } 
                })}
                autocomplete="off"
              />

              {/* Nombre Completo */}
              <IonInput
                className="createuser-input"
                placeholder="Nombre Completo"
                {...form.register("name")}
                autocomplete="off"
              />

              {/* Correo Electrónico */}
              <IonInput
                className="createuser-input"
                placeholder="Correo Electrónico"
                type="email"
                {...form.register("email")}
                autocomplete="off"
              />

              {/* Teléfono */}
              <IonInput
                className="createuser-input"
                placeholder="Teléfono"
                maxlength={9}
                onKeyDown={(e) => keyDown(e)}
                {...form.register("telefono")}
                autocomplete="off"
              />

              {/* Rol and Nº de Unidad - Row */}
              <div className="createuser-form-row">
                <IonSelect
                  className="createuser-select"
                  placeholder="Rol"
                  interface="popover"
                  toggleIcon={chevronDown}
                  {...form.register("rol")}
                >
                  <IonSelectOption value="ADM">Administrador</IonSelectOption>
                  <IonSelectOption value="OFC">Oficial</IonSelectOption>
                  <IonSelectOption value="ENC">Encargado</IonSelectOption>
                  <IonSelectOption value="RES">Residente</IonSelectOption>
                </IonSelect>

                <IonSelect
                  className="createuser-select"
                  placeholder="Nº de Unidad"
                  interface="popover"
                  toggleIcon={chevronDown}
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
              <div className="createuser-form-row">
                <div className="createuser-date-wrapper">
                  <IonInput
                    className="createuser-input"
                    placeholder="Inicio"
                    value={fechaInicio ? moment(fechaInicio).format("DD/MM/YYYY") : ''}
                    readonly
                    onClick={() => modalInicio.current?.present()}
                  />
                  <IonIcon icon={calendarOutline} className="createuser-date-icon" />
                </div>

                <div className="createuser-date-wrapper">
                  <IonInput
                    className="createuser-input"
                    placeholder="Fin"
                    value={fechaFin ? moment(fechaFin).format("DD/MM/YYYY") : ''}
                    readonly
                    onClick={() => modalFin.current?.present()}
                  />
                  <IonIcon icon={calendarOutline} className="createuser-date-icon" />
                </div>
              </div>

              {/* Date Modals */}
              <IonModal ref={modalInicio} className="createuser-date-modal">
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

              <IonModal ref={modalFin} className="createuser-date-modal">
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

              {/* Submit Button */}
              <IonButton 
                expand="block" 
                className="createuser-submit-button"
                onClick={handleConfirm}
              >
                Confirmar
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateUser;
