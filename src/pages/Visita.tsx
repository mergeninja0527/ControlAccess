import { IonButton, IonCard, IonCardContent, IonContent, IonDatetime, IonIcon, IonInput, IonLoading, IonModal, IonPage, IonSelect, IonSelectOption, useIonToast } from "@ionic/react";
import { useRef, useState } from "react";
import ButtonNav from "../components/ButtonNav";
import { formatearRut, handleRutDown, validarDigV } from "../../utils/RutFormatter";
import { useForm } from "react-hook-form";
import moment from "moment";
import { calendar } from "ionicons/icons";
import { useAppSelector } from "../../hooks/loginHooks";
import httpClient from "../../hooks/CapacitorClient";

interface Campos {
  rut: string;
  name: string;
  email: string;
  telefono: string;
}

const Visita: React.FC = () => {
  const { unidades } = useAppSelector((state) => state.login);
  const [loading, setLoading] = useState<boolean>(false);
  const form = useForm();
  const modal = useRef<HTMLIonModalElement>(null);
  const [toast] = useIonToast();
  const initDate = moment();
  const [fechaInicio, setFechaInicio] = useState<string | string[] | null | undefined>(initDate.format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaFin, setFechaFin] = useState<string | string[] | null | undefined>(initDate.add(2, "days").format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaMin, setFechaMin] = useState(initDate.format("yyyy-MM-DDTHH:mm:ss"));
  const [fechaMax, setFechaMax] = useState(initDate.add(2, 'weeks').format("yyyy-MM-DDTHH:mm:ss"));

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
    const { rut, telefono } = form.getValues();
    const tmp = rut.split("-");
    let err = 0
    tmp[0] = tmp[0].replace(/\./g, '')
    tmp[1] = tmp[1] === 'K' ? 'k' : tmp[1]
    const digitoEsperado = validarDigV(tmp[0])
    const nameIn: Campos = {
      rut: "Rut",
      name: "Nombre",
      email: "Correo Electrónico",
      telefono: "Teléfono"
    }

    Object.keys(nameIn).every((key: string) => {
      if (form.getValues(key) === "") {
        const valorCampo: string = nameIn[key as keyof typeof nameIn];
        err++;
        return showToast(`Campo debe estar completo: ${valorCampo}.`, "warning");
      }
    })

    if (err !== 0) return false;

    if (String(digitoEsperado) !== tmp[1]) {
      return showToast("Rut inválido.", "warning");
    }

    if (telefono.length !== 9) {
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
      const fi = moment(fechaInicio).format("yyyy-MM-DD HH:mm:ss")
      const ff = moment(fechaFin).format("yyyy-MM-DD HH:mm:ss")
      const response = await httpClient.post('/mobile/visita', { ...form.getValues(), fechaInicio: fi, fechaFin: ff })
      if (response.status === 403) return showToast(response.data.message, "danger");

      showToast("Invitación generada correctamente.", "success");
      form.reset();
      changeTime();
    } catch {
      showToast("Ocurrio algún error al crear la invitación.", "danger");
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

  const changeTime = () => {
    const nowDate = moment();
    setFechaInicio(nowDate.format("yyyy-MM-DDTHH:mm:ss"));
    setFechaFin(nowDate.add(2, "days").format("yyyy-MM-DDTHH:mm:ss"));
    setFechaMin(nowDate.format("yyyy-MM-DDTHH:mm:ss"));
    setFechaMax(nowDate.add(2, "weeks").format("yyyy-MM-DDTHH:mm:ss"));
  }

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonLoading spinner={"circles"} isOpen={loading} onDidDismiss={() => setLoading(false)} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonCard style={{ width: '90%', maxWidth: '500px' }}>
            <IonCardContent>
              <IonInput label="Rut" id="txtRut" labelPlacement="stacked" fill="outline" placeholder='Sin puntos ni guión' onKeyDown={handleRutDown} style={{ marginBottom: "10px" }}
                {...form.register("rut", { onChange: (e) => { form.setValue('rut', formatearRut(e.target.value)) } })} autocomplete='off' />

              <IonInput label="Nombre" id="txtNombre" labelPlacement="stacked" fill="outline" placeholder='Nombre' style={{ marginBottom: "10px" }}
                {...form.register("name")} autocomplete='off' />

              <IonInput label="Correo Electrónico" id="txtEmail" labelPlacement="stacked" fill="outline" placeholder='Ej: aaa@bb.com' style={{ marginBottom: "10px" }}
                {...form.register("email")} autocomplete='off' />

              <IonInput label="Teléfono" id="txtTelefono" labelPlacement="stacked" fill="outline" placeholder='Ej: 9.......' style={{ marginBottom: "10px" }}
                {...form.register("telefono")} autocomplete='off' maxlength={9} onKeyDown={(e) => { keyDown(e) }} />

              <IonInput label="Rol" id="txtRol" labelPlacement="stacked" fill="outline" placeholder='' style={{ marginBottom: "10px" }}
                value={"Visita"} autocomplete='off' readonly />

              <IonInput label="Fecha Inicio" id="txtFechaInicio" labelPlacement="stacked" fill="outline" placeholder='' style={{ marginBottom: "10px" }}
                value={moment(fechaInicio).format("DD-MM-yyyy HH:mm:ss")} autocomplete='off' readonly />

              <IonInput id="xxx" label="Fecha Término" labelPlacement="stacked" fill="outline" readonly value={moment(fechaFin).format("DD-MM-yyyy HH:mm:ss")}
                style={{ marginTop: "10px", marginBottom: "10px" }} autocomplete='off'>
                <IonButton fill="clear" slot="end" onClick={() => modal.current?.present()} aria-label="Show/hide">
                  <IonIcon slot="icon-only" icon={calendar} aria-hidden="true"></IonIcon>
                </IonButton>
              </IonInput>

              <IonModal ref={modal}>
                <IonDatetime
                  style={{ margin: "0 auto" }}
                  showDefaultButtons={true}
                  presentation="date-time"
                  onIonChange={(e) => setFechaFin(e.detail.value)}
                  min={fechaMin}
                  max={fechaMax}
                  value={fechaFin}
                // formatOptions={{
                //   date: {
                //     weekday: 'short',
                //     month: 'long',
                //     day: '2-digit',
                //   },
                //   time: {
                //     hour: '2-digit',
                //     minute: '2-digit',
                //   },
                // }}
                />
              </IonModal>

              <IonSelect label="Nro. Unidad" id="selUnidad" placeholder="" interface="popover" fill="outline" {...form.register("nroUnidad")} style={{ marginBottom: "10px" }}>
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

export default Visita;