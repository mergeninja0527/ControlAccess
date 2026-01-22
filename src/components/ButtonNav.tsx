import { IonFab, IonFabButton, IonFabList, IonIcon, useIonRouter } from "@ionic/react";
import { arrowUp, home, logOut, mail, personAdd, qrCodeSharp } from "ionicons/icons";
import { useAppSelector } from "../../hooks/loginHooks";
import { handleLogout } from "../../reducers/loginThunks";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../reducers/store";

interface ButtonProps { }

const ButtonNav: React.FC<ButtonProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useIonRouter();
  const { userrol } = useAppSelector((state) => state.login)

  const logout = () => {
    router.push('/login', 'root', 'replace')
    dispatch(handleLogout())
  }

  return (
    <IonFab slot="fixed" vertical="bottom" horizontal="end">
      <IonFabButton>
        <IonIcon icon={arrowUp}></IonIcon>
      </IonFabButton>
      <IonFabList side="top">
        {
          userrol !== "VIS" && (
            <>
              <IonFabButton onClick={logout}>
                <IonIcon icon={logOut}></IonIcon>
              </IonFabButton>
              <IonFabButton routerLink="/home">
                <IonIcon icon={home}></IonIcon>
              </IonFabButton>
              <IonFabButton routerLink="/qr">
                <IonIcon icon={qrCodeSharp}></IonIcon>
              </IonFabButton>
            </>
          )
        }
        {
          userrol !== "VIS" && userrol !== "OFC" && (
            <>
              {
                userrol !== "OFC" && (
                  <IonFabButton routerLink="/registry">
                    <IonIcon icon={personAdd}></IonIcon>
                  </IonFabButton>
                )
              }
              <IonFabButton routerLink="/visit">
                <IonIcon icon={mail}></IonIcon>
              </IonFabButton>
            </>
          )
        }
      </IonFabList>
    </IonFab>
  );
};

export default ButtonNav;