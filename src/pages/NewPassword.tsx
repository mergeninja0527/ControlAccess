import { IonButton, IonContent, IonIcon, IonInput, IonLoading, IonPage, useIonRouter, useIonToast } from "@ionic/react";
import { eye } from 'ionicons/icons';
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppSelector } from "../../hooks/loginHooks";
import httpClient from "../../hooks/CapacitorClient";
import logo from '../../assets/images/logo.png';
import '../../assets/NewPassword.css';

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

      // Validate password length
      if (password.length < 6) {
        showToast("La contraseña debe tener al menos 6 caracteres", "warning");
        return false;
      }

      setLoading(true);
      const normalizedUser = user?.replace(/\./g, '') || '';
      const response = await httpClient.patch('/auth/password', {
        username: normalizedUser,
        password: password
      });
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

  const handleBackToLogin = () => {
    router.push('/login', 'back', 'pop');
  };

  useEffect(() => {
    form.setValue("username", user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <IonPage>
      <IonContent fullscreen className="newpassword-content">
        <IonLoading spinner={"circles"} isOpen={loading} onDidDismiss={() => setLoading(false)} />
        
        <div className="newpassword-container">
          {/* Logo */}
          <div className="newpassword-logo-section">
            <img src={logo} alt="Logo" />
          </div>

          {/* Header */}
          <div className="newpassword-header-section">
            <h1>Nueva contraseña</h1>
            <p>Ingrese sus datos para crear una nueva contraseña</p>
          </div>

          {/* Form */}
          <div className="newpassword-form-section">
            {/* Nombre de Usuario */}
            <IonInput 
              className="newpassword-input-field"
              placeholder="Nombre de Usuario"
              {...form.register("username")} 
              autocomplete='off'
            />

            {/* Contraseña */}
            <div className="newpassword-password-wrapper">
              <IonInput 
                id="txtPassword"
                className="newpassword-input-field"
                placeholder="Contraseña"
                type={showPassword ? "text" : "password"}
                {...form.register("password")} 
                autocomplete='off'
              />
              <IonButton fill="clear" className="newpassword-toggle-btn" onClick={handleShowPassword} aria-label="Show/hide">
                <IonIcon slot="icon-only" icon={eye} aria-hidden="true" />
              </IonButton>
            </div>

            {/* Confirmar Contraseña */}
            <div className="newpassword-password-wrapper">
              <IonInput 
                id="txtPassword2"
                className="newpassword-input-field"
                placeholder="Confirmar Contraseña"
                type={showPassword2 ? "text" : "password"}
                {...form.register("confPassword")} 
                autocomplete='off'
              />
              <IonButton fill="clear" className="newpassword-toggle-btn" onClick={() => { setShowPassword2(!showPassword2) }} aria-label="Show/hide">
                <IonIcon slot="icon-only" icon={eye} aria-hidden="true" />
              </IonButton>
            </div>

            {/* Submit Button */}
            <IonButton expand='block' className="newpassword-submit-button" onClick={handleButtonClick}>
              Ingresar
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default NewPassword
