import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ProtectedRoleRoute } from '../ProtectedRoleRoute';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import QRView from './pages/QRView';

/* Pages */
import Home from './pages/Home';
import Login from './pages/Login';
import NewPassword from './pages/NewPassword';
import Visita from './pages/Visita';
import CreateUser from './pages/CreateUser';
import InvitationList from './pages/InvitationList';

setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <ProtectedRoleRoute exact path='/home' component={Home} roles={["SAD", "ADM", "SUP", "USR", "VIS", "PRO", "OFC", "ENC", "RES"]} />
          <ProtectedRoleRoute exact path="/qr" component={QRView} roles={["SAD", "ADM", "SUP", "USR", "VIS", "PRO", "OFC", "ENC", "RES"]} />
          <ProtectedRoleRoute exact path="/modpass" component={NewPassword} roles={["SAD", "ADM", "SUP", "USR", "VIS", "PRO", "OFC", "ENC", "RES"]} />
          <ProtectedRoleRoute exact path="/createuser" component={CreateUser} roles={["SAD", "ADM", "SUP", "PRO", "ENC"]} />
          <ProtectedRoleRoute exact path="/visit" component={Visita} roles={["SAD", "ADM", "SUP", "USR", "PRO", "ENC", "RES"]} />
          <ProtectedRoleRoute exact path="/invitations" component={InvitationList} roles={["SAD", "ADM", "SUP", "USR", "PRO", "ENC", "RES"]} />
          <Route exact path="/login" component={Login} />
          <Redirect exact from="/" to="/login" />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
};

export default App;
