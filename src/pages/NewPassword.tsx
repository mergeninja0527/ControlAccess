import { IonButton, IonContent, IonIcon, IonInput, IonLoading, IonPage, useIonRouter, useIonToast } from "@ionic/react";
import { eye, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { useEffect, useState, useRef } from "react";
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
  const [validatingUser, setValidatingUser] = useState<boolean>(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<{nombre: string, rut: string, idRol?: number} | null>(null);
  const router = useIonRouter();
  const { user } = useAppSelector((state) => state.login)
  const form = useForm();
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleShowPassword = () => {
    setShowPassword(!showPassword)
  };

  // Validate if user exists in database
  const validateUser = async (username: string) => {
    if (!username || username.trim() === '') {
      setUserExists(null);
      setUserInfo(null);
      return;
    }

    setValidatingUser(true);
    try {
      const response = await httpClient.post('/mobile/get-user-by-rut', { rut: username.trim() });
      
      if (response.data?.success && response.data?.exists) {
        setUserExists(true);
        setUserInfo({
          nombre: response.data.user.nombre,
          rut: response.data.user.rut,
          idRol: response.data.user.idRol
        });
        console.log('[NewPassword] User validated:', response.data.user);
      } else {
        setUserExists(false);
        setUserInfo(null);
      }
    } catch (error: any) {
      console.error('[NewPassword] Error validating user:', error);
      setUserExists(false);
      setUserInfo(null);
    } finally {
      setValidatingUser(false);
    }
  };

  // Handle username input change with debounce
  const handleUsernameInput = (value: string) => {
    form.setValue("username", value);
    
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Reset validation state
    setUserExists(null);
    setUserInfo(null);
    
    // Validate after user stops typing (500ms debounce)
    if (value.trim()) {
      validationTimeoutRef.current = setTimeout(() => {
        validateUser(value);
      }, 500);
    }
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

      // Validate that user exists before allowing password change
      const username = form.getValues("username") || user || '';
      if (!username.trim()) {
        showToast("El nombre de usuario es requerido", "warning");
        return false;
      }

      // Check if user was validated and exists
      if (userExists === false) {
        showToast("El usuario no existe en la base de datos. Por favor, verifique el nombre de usuario.", "danger");
        return false;
      }

      // If user hasn't been validated yet, validate now
      if (userExists === null) {
        setLoading(true);
        try {
          await validateUser(username);
          // Wait a bit for state to update
          await new Promise(resolve => setTimeout(resolve, 300));
          if (userExists === false) {
            showToast("El usuario no existe en la base de datos. Por favor, verifique el nombre de usuario.", "danger");
            setLoading(false);
            return false;
          }
        } catch (error) {
          showToast("Error al validar el usuario", "danger");
          setLoading(false);
          return false;
        }
      }

      setLoading(true);
      
      // Use the validated user's RUT if available, otherwise use the entered username
      const usernameToUse = userInfo?.rut || username.trim();
      
      const response = await httpClient.patch('/auth/password', {
        username: usernameToUse, // Send original value, backend will handle normalization
        password: password
      });
      if (response.status === 403) return showToast(response.data.message, "danger");
      
      showToast("Contraseña modificada con éxito. Por favor, inicie sesión con su nueva contraseña.", "success");
      setTimeout(() => {
        router.push('/login', 'root', 'replace');
      }, 1500)
    } catch (error: any) {
      console.error('[NewPassword] Error:', error);
      showToast(error.response?.data?.message || "Ocurrio algún error al modificar contraseña", "danger");
    } finally {
      setLoading(false);
    }
  }

  const handleBackToLogin = () => {
    router.push('/login', 'back', 'pop');
  };

  useEffect(() => {
    // Set username from Redux if available (logged in user), otherwise leave empty for manual entry
    if (user) {
      form.setValue("username", user);
      validateUser(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
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
            <div style={{ position: 'relative', width: '100%', marginBottom: '10px' }}>
              <IonInput 
                className="newpassword-input-field"
                placeholder="RUT (ej: 12.345.678-9)"
                {...form.register("username", {
                  onChange: (e) => handleUsernameInput(e.target.value)
                })} 
                autocomplete='off'
              />
              {/* Validation indicator */}
              {validatingUser && (
                <div style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <IonLoading spinner="dots" style={{ width: '20px', height: '20px' }} />
                </div>
              )}
              {!validatingUser && userExists === true && (
                <div style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'green'
                }}>
                  <IonIcon icon={checkmarkCircle} style={{ fontSize: '24px' }} />
                </div>
              )}
              {!validatingUser && userExists === false && form.getValues("username")?.trim() && (
                <div style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'red'
                }}>
                  <IonIcon icon={closeCircle} style={{ fontSize: '24px' }} />
                </div>
              )}
              {/* User info display */}
              {userExists === true && userInfo && (
                <div style={{ 
                  marginTop: '5px', 
                  fontSize: '12px', 
                  color: 'green',
                  paddingLeft: '5px'
                }}>
                  Usuario encontrado: {userInfo.nombre}
                </div>
              )}
              {userExists === false && form.getValues("username")?.trim() && (
                <div style={{ 
                  marginTop: '5px', 
                  fontSize: '12px', 
                  color: 'red',
                  paddingLeft: '5px'
                }}>
                  Usuario no encontrado en la base de datos
                </div>
              )}
            </div>

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
            <IonButton 
              expand='block' 
              className="newpassword-submit-button" 
              onClick={handleButtonClick}
              disabled={userExists === false || validatingUser}
            >
              Cambiar Contraseña
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default NewPassword
