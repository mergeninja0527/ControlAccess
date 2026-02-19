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
import { useRef, useState, useEffect } from "react";
import { formatearRut, handleRutDown } from "../../utils/RutFormatter";
import { validateEmail, validateNombre, validateTelefono, validateRut, validatePassword } from "../../utils/Validators";
import { useForm } from "react-hook-form";
import moment from "moment";
import { arrowBack, calendarOutline, chevronDown, refreshOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";
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
  const { unidades: unidadesFromRedux } = useAppSelector((state) => state.login);
  const [unidades, setUnidades] = useState<Array<{value: number | string, label: string}>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const form = useForm();
  const modalInicio = useRef<HTMLIonModalElement>(null);
  const modalFin = useRef<HTMLIonModalElement>(null);
  const [toast] = useIonToast();
  const initDate = moment();
  const [fechaInicio, setFechaInicio] = useState<string | string[] | null | undefined>(initDate.format("YYYY-MM-DDTHH:mm:ss"));
  const [fechaFin, setFechaFin] = useState<string | string[] | null | undefined>(initDate.add(30, "days").format("YYYY-MM-DDTHH:mm:ss"));
  const [fechaMin] = useState(moment().format("YYYY-MM-DDTHH:mm:ss"));
  const [fechaMax] = useState(moment().add(1, 'year').format("YYYY-MM-DDTHH:mm:ss"));
  const [showPassword, setShowPassword] = useState(false);

  // Fetch unidades on component mount
  useEffect(() => {
    const fetchUnidades = async () => {
      // First, try to use unidades from Redux if available
      if (unidadesFromRedux && unidadesFromRedux.length > 0) {
        const mappedUnidades = unidadesFromRedux.map((u: any) => ({ 
          value: typeof u.value === 'string' ? parseInt(u.value) || u.value : u.value, 
          label: u.label 
        }));
        console.log('[CreateUser] Using unidades from Redux:', mappedUnidades);
        setUnidades(mappedUnidades);
        return;
      }
      
      // Otherwise, fetch from API
      try {
        console.log('[CreateUser] Fetching unidades from API...');
        const response = await httpClient.get('/unidades');
        console.log('[CreateUser] Unidades API response:', response.data);
        
        if (response.data?.success && response.data?.data && response.data.data.length > 0) {
          console.log('[CreateUser] Setting unidades from API:', response.data.data);
          setUnidades(response.data.data);
        } else if (response.data?.data && response.data.data.length > 0) {
          // Fallback: if success flag is missing but data exists
          console.log('[CreateUser] Setting unidades from API (fallback):', response.data.data);
          setUnidades(response.data.data);
        } else {
          console.warn('[CreateUser] No unidades found in API response');
        }
      } catch (error: any) {
        console.error('[CreateUser] Error fetching unidades:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
        console.error('[CreateUser] Error details:', errorMsg);
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
    router.push('/home', 'back', 'pop');
  };

  const generateStrongPassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    const symbols = "!@#$%&*";
    const all = upper + lower + digits + symbols;
    let pass = "";
    pass += upper[Math.floor(Math.random() * upper.length)];
    pass += lower[Math.floor(Math.random() * lower.length)];
    pass += digits[Math.floor(Math.random() * digits.length)];
    pass += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 0; i < 10; i++) {
      pass += all[Math.floor(Math.random() * all.length)];
    }
    pass = pass.split("").sort(() => Math.random() - 0.5).join("");
    form.setValue("password", pass);
  };

  const handleConfirm = async () => {
    const formValues = form.getValues();
    const { rut, name, email, telefono, password, rol, nroUnidad } = formValues;
    
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

    const passwordValidation = validatePassword(password || "");
    if (!passwordValidation.valid) {
      return showToast(passwordValidation.message || "Contraseña inválida.", "warning");
    }
    
    if (!rol) {
      return showToast("El rol es requerido.", "warning");
    }

    // Nº de Unidad is required only for Residente (Tenant)
    if (rol === 'RES' && (!nroUnidad || nroUnidad === '')) {
      return showToast("La unidad es requerida para el rol Residente.", "warning");
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
      const rutCheckResponse = await httpClient.post('/check-rut', { rut: normalizedRut });
      
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
      const fi = moment(fechaInicio).format("YYYY-MM-DD HH:mm:ss");
      const ff = moment(fechaFin).format("YYYY-MM-DD HH:mm:ss");
      const normalizedRut = rut.replace(/\./g, '').trim();
      
      const response = await httpClient.post('/createUser', { 
        rut: normalizedRut,
        nombre: name.trim(),
        correo: email.trim(),
        telefono: telefono.trim(),
        password: (password || "").trim(),
        rol,
        sala: rol === 'RES' ? nroUnidad : (nroUnidad || null),
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
                placeholder="RUT (ej: 12.345.678-9)"
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

              {/* Contraseña + Generar */}
              <div className="createuser-form-row createuser-password-row">
                <div className="createuser-password-wrapper">
                  <IonInput
                    className="createuser-input createuser-password-input"
                    placeholder="Contraseña"
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    autocomplete="new-password"
                  />
                  <IonButton
                    type="button"
                    fill="clear"
                    className="createuser-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} slot="icon-only" />
                  </IonButton>
                </div>
                <IonButton
                  type="button"
                  fill="outline"
                  className="createuser-generate-password-btn"
                  onClick={generateStrongPassword}
                >
                  <IonIcon icon={refreshOutline} />
                  Generar
                </IonButton>
              </div>

              {/* Rol and Nº de Unidad - Row */}
              <div className="createuser-form-row">
                <IonSelect
                  className="createuser-select"
                  placeholder="Rol"
                  interface="popover"
                  toggleIcon={chevronDown}
                  {...form.register("rol")}
                >
                  <IonSelectOption value="SAD">Super Administrador</IonSelectOption>
                  <IonSelectOption value="ADM">Administrador</IonSelectOption>
                  <IonSelectOption value="PRO">Propietario</IonSelectOption>
                  <IonSelectOption value="ENC">Encargado</IonSelectOption>
                  <IonSelectOption value="OFC">Oficinista</IonSelectOption>
                  <IonSelectOption value="RES">Residente</IonSelectOption>
                  <IonSelectOption value="VIS">Visita</IonSelectOption>
                </IonSelect>

                <IonSelect
                  className="createuser-select"
                  placeholder={
                    unidades && unidades.length > 0
                      ? (form.watch?.('rol') === 'RES' ? "Nº de Unidad (requerido)" : "Nº de Unidad (opcional)")
                      : "Cargando unidades..."
                  }
                  interface="popover"
                  toggleIcon={chevronDown}
                  disabled={!unidades || unidades.length === 0}
                  {...form.register("nroUnidad")}
                >
                  {unidades && unidades.length > 0 ? (
                    <>
                      {form.watch?.('rol') !== 'RES' && (
                        <IonSelectOption value="">Ninguna</IonSelectOption>
                      )}
                      {unidades.map(({ value, label }) => (
                        <IonSelectOption key={`${label}_${value}`} value={value}>
                          {label}
                        </IonSelectOption>
                      ))}
                    </>
                  ) : (
                    <IonSelectOption value="" disabled>
                      No hay unidades disponibles
                    </IonSelectOption>
                  )}
                </IonSelect>
              </div>

              {/* Time range: permissions valid only in this window (date + time) */}
              <p className="createuser-hint" style={{ marginBottom: '6px', fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                El acceso es válido solo en el horario indicado (fecha y hora).
              </p>
              <div className="createuser-form-row">
                <div className="createuser-date-wrapper">
                  <IonInput
                    className="createuser-input"
                    placeholder="Desde (fecha y hora)"
                    value={fechaInicio ? moment(fechaInicio).format("DD/MM/YYYY HH:mm") : ''}
                    readonly
                    onClick={() => modalInicio.current?.present()}
                  />
                  <IonIcon icon={calendarOutline} className="createuser-date-icon" />
                </div>

                <div className="createuser-date-wrapper">
                  <IonInput
                    className="createuser-input"
                    placeholder="Hasta (fecha y hora)"
                    value={fechaFin ? moment(fechaFin).format("DD/MM/YYYY HH:mm") : ''}
                    readonly
                    onClick={() => modalFin.current?.present()}
                  />
                  <IonIcon icon={calendarOutline} className="createuser-date-icon" />
                </div>
              </div>

              {/* Date-time Modals (time range, not just days) */}
              <IonModal ref={modalInicio} className="createuser-date-modal">
                <IonDatetime
                  style={{ margin: "0 auto" }}
                  showDefaultButtons={true}
                  presentation="date-time"
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
                  presentation="date-time"
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
