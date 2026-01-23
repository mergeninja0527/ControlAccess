import { IonButton, IonContent, IonInput, IonLoading, IonPage, IonSelect, IonSelectOption, useIonRouter, useIonToast } from "@ionic/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { formatearRut, handleRutDown, validarDigV } from '../../utils/RutFormatter';
import moment from "moment";
import { useAppSelector } from "../../hooks/loginHooks";
import httpClient from '../../hooks/CapacitorClient';
import logo from '../../assets/images/logo.png';
import '../../assets/Registrar.css';

interface Campos {
  rut: string;
  name: string;
  email: string;
  telefono: string;
}

const nameIn: Campos = {
  rut: "Rut",
  name: "Nombre",
  email: "Correo Electrónico",
  telefono: "Teléfono"
}

const Registrar: React.FC = () => {
  const router = useIonRouter();
  const { rolesRegistro, unidades } = useAppSelector((state) => state.login);
  const [loading, setLoading] = useState<boolean>(false);
  const [fechaInicio, setFechaInicio] = useState<string>(moment().format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaFin, setFechaFin] = useState<string>(moment().add(6, "M").format("yyyy-MM-DDTHH:mm:ss"));
  const form = useForm();
  const [toast] = useIonToast();

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

  const handleButtonClick = async () => {
    const { rut, telefono, rol, sala } = form.getValues();
    const tmp = rut.split("-");
    let err = 0
    tmp[0] = tmp[0].replace(/\./g, '')
    tmp[1] = tmp[1] === 'K' ? 'k' : tmp[1]
    const digitoEsperado = validarDigV(tmp[0])

    Object.keys(nameIn).every((key: string) => {
      if (form.getValues(key) === "") {
        const valorCampo: string = nameIn[key as keyof typeof nameIn];
        err++;
        return showToast(`Campo debe estar completo: ${valorCampo}.`, "warning");
      }
    })

    if (err !== 0) return false;

    if (!rol || rol === "") return showToast(`Campo debe estar completo: Rol.`, "warning");

    if (!sala || sala === "") return showToast(`Campo debe estar completo: Nro. Unidad.`, "warning");

    if (String(digitoEsperado) !== tmp[1]) {
      return showToast("Rut inválido.", "warning");
    }

    if (telefono.length !== 9) {
      return showToast("Número de teléfono inválido.", "warning");
    }

    try {
      setLoading(true);
      const response = await httpClient.post('/mobile/registrar', { ...form.getValues(), fechaInicio, fechaFin })
      if (response.status === 403) return showToast(response.data.message, "danger");

      showToast("Registro realizado correctamente.", "success");

      form.reset();
      setFechaInicio(moment().format("yyyy-MM-DDTHH:mm:ss"));
      setFechaFin(moment().add(6, "M").format("yyyy-MM-DDTHH:mm:ss"));
    } catch {
      showToast("Ocurrio algún error al realizar el registro.", "danger");
    } finally {
      setLoading(false);
    }
  }

  const handleBackToLogin = () => {
    router.push('/login', 'back', 'pop');
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
  }

  return (
    <IonPage>
      <IonContent fullscreen className="registrar-content">
        <IonLoading spinner={"circles"} isOpen={loading} onDidDismiss={() => setLoading(false)} />
        
        <div className="registrar-container">
          {/* Logo */}
          <div className="registrar-logo-section">
            <img src={logo} alt="Logo" />
          </div>

          {/* Header */}
          <div className="registrar-header-section">
            <h1>Registro</h1>
            <p>Por favor ingrese sus datos para registrarse.</p>
          </div>

          {/* Form */}
          <div className="registrar-form-section">
            {/* Rut */}
            <IonInput 
              className="registrar-input-field"
              placeholder="Rut"
              onKeyDown={handleRutDown}
              {...form.register("rut", { onChange: (e) => { form.setValue('rut', formatearRut(e.target.value)) } })} 
              autocomplete='off'
            />

            {/* Nombre */}
            <IonInput 
              className="registrar-input-field"
              placeholder="Nombre Completo"
              {...form.register("nombre")} 
              autocomplete='off'
            />

            {/* Correo Electrónico */}
            <IonInput 
              className="registrar-input-field"
              placeholder="Correo Electrónico"
              {...form.register("correo")} 
              autocomplete='off'
            />

            {/* Teléfono */}
            <IonInput 
              className="registrar-input-field"
              placeholder="Teléfono"
              {...form.register("telefono")} 
              autocomplete='off'
              maxlength={9}
              onKeyDown={(e) => { keyDown(e) }}
            />

            {/* Rol */}
            <IonSelect 
              className="registrar-select-field"
              placeholder="Rol" 
              interface="popover" 
              {...form.register("rol")}
            >
              {
                (rolesRegistro || []).map(({ value, label }) => (
                  <IonSelectOption key={`${label}_${value}`} value={value}>{label}</IonSelectOption>
                ))
              }
            </IonSelect>

            {/* Nro. Unidad */}
            <IonSelect 
              className="registrar-select-field"
              placeholder="Nro. Unidad" 
              interface="popover" 
              {...form.register("sala")}
            >
              {
                (unidades || []).map(({ value, label }) => (
                  <IonSelectOption key={`${label}_${value}`} value={value}>{label}</IonSelectOption>
                ))
              }
            </IonSelect>

            {/* Submit Button */}
            <IonButton expand='block' className="registrar-submit-button" onClick={handleButtonClick}>
              Ingresar
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Registrar;
