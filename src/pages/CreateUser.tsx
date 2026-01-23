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
import { useForm } from "react-hook-form";
import moment from "moment";
import { arrowBack, calendarOutline } from "ionicons/icons";
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
        const response = await httpClient.post('/mobile/createUser', { ...form.getValues(), fechaInicio: fi, fechaFin: ff });
        if (response.status === 403) return showToast(response.data.message, "danger");

        showToast("Usuario creado correctamente.", "success");
        form.reset();
        router.push('/home', 'back', 'pop');
      } catch {
        showToast("Ocurrió algún error al crear el usuario.", "danger");
      } finally {
        setLoading(false);
      }
    } else {
      showToast("Por favor complete todos los campos.", "warning");
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
