import { IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/react';
import { qrCodeOutline, personAddOutline, mailOutline, logOutOutline, listOutline } from 'ionicons/icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../reducers/store';
import { handleLogout } from '../../reducers/loginThunks';
import { useAppSelector } from '../../hooks/loginHooks';
import { hasRole } from '../../ProtectedRoleRoute';
import logo from '../../assets/images/logo.png';
import '../../assets/Home.css';

const Home: React.FC = () => {
  const router = useIonRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { username, userrol } = useAppSelector((state) => state.login);
  
  // Define which roles can access each feature
  const canCreateUser = hasRole(userrol, ["SAD", "ADM", "SUP", "PRO", "ENC"]);
  const canInvite = hasRole(userrol, ["SAD", "ADM", "SUP", "USR", "PRO", "ENC", "RES"]);
  const canViewInvitations = hasRole(userrol, ["SAD", "ADM", "SUP", "USR", "PRO", "ENC", "RES"]);

  const handleLogoutClick = () => {
    dispatch(handleLogout());
    router.push('/login', 'root', 'replace');
  };

  const navigateTo = (path: string) => {
    router.push(path, 'forward', 'push');
  };

  // Format current date for "last login" display
  const getLastLoginDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes} hs.`;
  };

  return (
    <IonPage>
      <IonContent fullscreen className="home-content">
        <div className="home-container">
          {/* Logo */}
          <div className="home-logo-section">
            <img src={logo} alt="Logo" />
          </div>

          {/* Greeting */}
          <div className="greeting-section">
            <h1>Hola, {username || 'Juan'}!</h1>
          </div>

          {/* Menu Cards */}
          <div className="menu-cards-section">
            {/* QR Card - Available to all logged-in users */}
            <button className="menu-card" onClick={() => navigateTo('/qr')}>
              <IonIcon icon={qrCodeOutline} className="menu-card-icon" />
              <span className="menu-card-label">QR</span>
            </button>

            {/* Crear Usuario Card - Only for administrators/managers */}
            {canCreateUser && (
              <button className="menu-card" onClick={() => navigateTo('/createuser')}>
                <IonIcon icon={personAddOutline} className="menu-card-icon" />
                <span className="menu-card-label">Crear Usuario</span>
              </button>
            )}

            {/* Invitar Card - Available to most roles except visitors */}
            {canInvite && (
              <button className="menu-card" onClick={() => navigateTo('/visit')}>
                <IonIcon icon={mailOutline} className="menu-card-icon" />
                <span className="menu-card-label">Invitar</span>
              </button>
            )}

            {/* Mis Invitaciones Card - Available to most roles except visitors */}
            {canViewInvitations && (
              <button className="menu-card" onClick={() => navigateTo('/invitations')}>
                <IonIcon icon={listOutline} className="menu-card-icon" />
                <span className="menu-card-label">Mis Invitaciones</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="home-footer-section">
            {/* Logout Button */}
            <button className="logout-button" onClick={handleLogoutClick}>
              <IonIcon icon={logOutOutline} />
              <span>Cerrar Sesión</span>
            </button>

            {/* Last Login */}
            <p className="last-login-text">
              Último ingreso: {getLastLoginDate()}
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
