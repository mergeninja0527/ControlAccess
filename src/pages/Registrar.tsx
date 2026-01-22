import { IonButton, IonCard, IonCardContent, IonContent, IonInput, IonLoading, IonPage, IonSelect, IonSelectOption, useIonToast } from "@ionic/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { formatearRut, handleRutDown, validarDigV } from '../../utils/RutFormatter';
import moment from "moment";
import ButtonNav from "../components/ButtonNav";
import { useAppSelector } from "../../hooks/loginHooks";
import httpClient from '../../hooks/CapacitorClient';

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
      <IonContent fullscreen>
        <IonLoading spinner={"circles"} isOpen={loading} onDidDismiss={() => setLoading(false)} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonCard style={{ width: '90%', maxWidth: '500px' }}>
            <IonCardContent>
              <IonInput label="Rut" labelPlacement="stacked" fill="outline" placeholder='Sin puntos ni guión' onKeyDown={handleRutDown} style={{ marginBottom: "10px" }}
                {...form.register("rut", { onChange: (e) => { form.setValue('rut', formatearRut(e.target.value)) } })} autocomplete='off' />

              <IonInput label="Nombre" labelPlacement="stacked" fill="outline" placeholder='Nombre' style={{ marginBottom: "10px" }}
                {...form.register("nombre")} autocomplete='off' />

              <IonInput label="Correo Electrónico" labelPlacement="stacked" fill="outline" placeholder='Ej: aaa@bb.com' style={{ marginBottom: "10px" }}
                {...form.register("correo")} autocomplete='off' />

              <IonInput label="Teléfono" labelPlacement="stacked" fill="outline" placeholder='Ej: 9.......' style={{ marginBottom: "10px" }}
                {...form.register("telefono")} autocomplete='off' maxlength={9} onKeyDown={(e) => { keyDown(e) }} />

              <IonSelect label="Rol" placeholder="" interface="popover" fill="outline" {...form.register("rol")} style={{ marginBottom: "10px" }}>
                {
                  (rolesRegistro || []).map(({ value, label }) => (
                    <IonSelectOption key={`${label}_${value}`} value={value}>{label}</IonSelectOption>
                  ))
                }
              </IonSelect>

              <IonSelect label="Nro. Unidad" placeholder="" interface="popover" fill="outline" {...form.register("sala")} style={{ marginBottom: "10px" }}>
                {
                  (unidades || []).map(({ value, label }) => (
                    <IonSelectOption key={`${label}_${value}`} value={value}>{label}</IonSelectOption>
                  ))
                }
              </IonSelect>

              <IonButton expand='block' size='small' onClick={handleButtonClick}>Ingresar</IonButton>
            </IonCardContent>
          </IonCard>
        </div>
        <ButtonNav />
      </IonContent>
    </IonPage>
  );
}

export default Registrar;