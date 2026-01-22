import { IonButton, IonCard, IonCardContent, IonContent, IonIcon, IonInput, IonLoading, IonPage, useIonRouter, useIonToast } from "@ionic/react";
import { eye } from 'ionicons/icons';
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppSelector } from "../../hooks/loginHooks";
import httpClient from "../../hooks/CapacitorClient";

interface Campos {
  username: string;
  password: string;
  confPassword: string;
}

const nameIn: Campos = {
  username: "Nombre de Usuario",
  password: "Contraseña",
  confPassword: "Confirmar Contraseña"
}

const NewPassword: React.FC = () => {
  const [toast] = useIonToast();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPassword2, setShowPassword2] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useIonRouter();
  const { user } = useAppSelector((state) => state.login)
  const form = useForm();

  const handleShowPassword = () => {
    setShowPassword(!showPassword)
  };

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
    try {
      const { password, confPassword } = form.getValues();

      let err = 0;
      Object.keys(nameIn).every((key: string) => {
        if (form.getValues(key) === "") {
          const valorCampo: string = nameIn[key as keyof typeof nameIn];
          err++;
          return showToast(`Campo debe estar completo: ${valorCampo}.`, "warning");
        }
      })

      if (err !== 0) return false;

      if (password !== confPassword) {
        showToast("Constraseñas no coinciden", "warning");
        return false;
      }

      setLoading(true);
      const response = await httpClient.patch('/auth/password', form.getValues());
      if (response.status === 403) return showToast(response.data.message, "danger");
      
      showToast("Contraseña modificada con éxito", "success");
      setTimeout(() => {
        router.push('/home', 'root', 'replace');
      }, 500)
    } catch {
      showToast("Ocurrio algún error al modificar contraseña", "danger");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    form.setValue("username", user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonLoading spinner={"circles"} isOpen={loading} onDidDismiss={() => setLoading(false)} />
        <IonCard style={{ top: "34%", maxWidth: "30rem", margin: "auto" }}>
          <IonCardContent>
            <IonInput label="Nombre de Usuario" labelPlacement="stacked" fill="outline" placeholder='Usuario'
              {...form.register("username")} autocomplete='off'></IonInput>
            <IonInput id="txtPassword" label="Contraseña" labelPlacement="stacked" fill="outline" type={showPassword ? "text" : "password"}
              style={{ marginTop: "10px", marginBottom: "10px" }} {...form.register("password")} autocomplete='off' placeholder='Contraseña'>
              <IonButton fill="clear" slot="end" onClick={handleShowPassword} aria-label="Show/hide">
                <IonIcon slot="icon-only" icon={eye} aria-hidden="true"></IonIcon>
              </IonButton>
            </IonInput>
            <IonInput id="txtPassword2" label="Confirmar contraseña" labelPlacement="stacked" fill="outline" type={showPassword2 ? "text" : "password"}
              style={{ marginTop: "10px", marginBottom: "10px" }} {...form.register("confPassword")} autocomplete='off' placeholder='***'>
              <IonButton fill="clear" slot="end" onClick={() => { setShowPassword2(!showPassword2) }} aria-label="Show/hide">
                <IonIcon slot="icon-only" icon={eye} aria-hidden="true"></IonIcon>
              </IonButton>
            </IonInput>
            <IonButton expand='block' size='small' onClick={handleButtonClick}>Ingresar</IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
}

export default NewPassword