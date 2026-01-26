import { IonButton, IonContent, IonInput, IonLoading, IonPage, useIonRouter, useIonToast } from '@ionic/react';
import '../../assets/Login.css';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import httpClient from '../../hooks/CapacitorClient';
import { useAppDispatch } from '../../hooks/loginHooks';
import { handleLoginSuccess } from '../../reducers/loginThunks';
import { formatearRut } from '../../utils/RutFormatter';
import logo from '../../assets/images/logo.png';

const Login: React.FC = () => {
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

  const handleButtonClick = async () => {
    const formData = loginForm.getValues();
    console.log('[Login] Starting login attempt...');
    console.log('[Login] Form data:', JSON.stringify(formData));
    
    try {
      setLoading(true);
      const response = await httpClient.post('/mobile/auth/login', formData);

      console.log('[Login] Response received:', JSON.stringify(response));
      console.log('[Login] Response status:', response.status);
      console.log('[Login] Response data:', JSON.stringify(response.data));

      if (response.status === 403) {
        console.log('[Login] 403 Forbidden - ', response.data?.message);
        return showToast(response.data?.message || "Acceso denegado", "danger");
      }

      const { username, userrol, passTemp, roles, unidades } = response.data;
      console.log('[Login] Parsed data - username:', username, 'userrol:', userrol, 'passTemp:', passTemp);

      if (passTemp === 1) {
        dispatch(handleLoginSuccess(formData.username, username, userrol, roles, unidades))
        showToast("Inicio Sesión exitoso, debe modificar su contraseña.")
        return router.push('/modpass', 'root', 'replace')
      }

      showToast("Inicio Sesión exitoso")
      dispatch(handleLoginSuccess(formData.username, username, userrol, roles, unidades))
      setTimeout(() => {
        router.push('/home', 'root', 'replace')
      }, 500)
    } catch (error) {
      console.error('[Login] Error:', error);
      showToast("Error al iniciar sesión.", "danger");
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = () => {
    router.push('/modpass', 'forward', 'push');
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-content">
        <IonLoading spinner="circles" isOpen={loading} onDidDismiss={() => setLoading(false)} />
        
        <div className="login-container">
          {/* Logo */}
          <div className="logo-section">
            <img src={logo} alt="Logo" />
          </div>

          {/* Header */}
          <div className="header-section">
            <h1>Hola!</h1>
            <p>Completa con tus datos para ingresar</p>
          </div>

          {/* Form */}
          <div className="form-section">
            <IonInput
              className="input-field"
              placeholder="Rut"
              {...loginForm.register("username", { 
                onChange: (e) => { 
                  loginForm.setValue('username', formatearRut(e.target.value)) 
                } 
              })}
              autocomplete="off"
            />
            
            <IonInput
              className="input-field"
              placeholder="contraseña"
              type="password"
              {...loginForm.register("password")}
              autocomplete="off"
            />

            <IonButton 
              expand="block" 
              className="submit-button"
              onClick={handleButtonClick}
            >
              Ingresar
            </IonButton>
          </div>

          {/* Forgot Password */}
          <div className="forgot-password-section">
            <button 
              className="forgot-password-link"
              onClick={handleForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
