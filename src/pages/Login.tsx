import { IonButton, IonCard, IonCardContent, IonContent, IonIcon, IonInput, IonLoading, IonPage, useIonRouter, useIonToast } from '@ionic/react';
import { eye } from 'ionicons/icons';
import '../../assets/Login.css';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import httpClient from '../../hooks/CapacitorClient';
import { useAppDispatch } from '../../hooks/loginHooks';
import { handleLoginSuccess } from '../../reducers/loginThunks';
import { formatearRut } from '../../utils/RutFormatter';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const loginForm = useForm();
  const [toast] = useIonToast();
  const router = useIonRouter();
  const dispatch = useAppDispatch();

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

  const handleShowPassword = () => {
    setShowPassword(!showPassword)
  };

  const handleButtonClick = async () => {
    try {
      setLoading(true);
      const response = await httpClient.post('/mobile/auth/login', loginForm.getValues());

      if (response.status === 403) return showToast(response.data?.message, "danger");

      const { username, userrol, passTemp, roles, unidades } = response.data

      if (passTemp === 1) {
        dispatch(handleLoginSuccess(loginForm.getValues("username"), username, userrol, roles, unidades))
        showToast("Inicio Sesión exitoso, debe modificar su contraseña.")
        return router.push('/modpass', 'root', 'replace')
      }

      showToast("Inicio Sesión exitoso")
      dispatch(handleLoginSuccess(loginForm.getValues("username"), username, userrol, roles, unidades))
      setTimeout(() => {
        router.push('/home', 'root', 'replace')
      }, 500)
    } catch {
      showToast("Error al iniciar sesión.", "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonLoading spinner="circles" isOpen={loading} onDidDismiss={() => setLoading(false)} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonCard style={{ width: '90%', maxWidth: '500px' }}>
            <IonCardContent>
              <IonInput label="Rut" labelPlacement="stacked" fill="outline" placeholder='Sin puntos ni guión'
                {...loginForm.register("username", { onChange: (e) => { loginForm.setValue('username', formatearRut(e.target.value)) } })} autocomplete='off'></IonInput>
              <IonInput id="txtPassword" label="Contraseña" labelPlacement="stacked" fill="outline" type={showPassword ? "text" : "password"}
                style={{ marginTop: "10px", marginBottom: "10px" }} {...loginForm.register("password")} autocomplete='off' placeholder='Contraseña'>
                <IonButton fill="clear" slot="end" onClick={handleShowPassword} aria-label="Show/hide">
                  <IonIcon slot="icon-only" icon={eye} aria-hidden="true"></IonIcon>
                </IonButton>
              </IonInput>
              <IonButton expand='block' size='small' onClick={handleButtonClick}>Ingresar</IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
