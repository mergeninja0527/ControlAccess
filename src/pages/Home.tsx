import { IonCard, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import '../../assets/Home.css';
import ButtonNav from '../components/ButtonNav';
// import logo from '../../assets/images/logo.png';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>Inicio</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80dvh", opacity: ".4", marginLeft: "-20px" }}>
          {/* <IonImg
            style={{ maxWidth: "500px", width: "50dvw", heigth: "70dvh", maxHeigth: "500px" }}
            src={logo}
            alt={"SAPSG LOGO"}
          ></IonImg> */}
        </div>
        <IonCard>
        </IonCard>
        <ButtonNav />
      </IonContent>
    </IonPage >
  );
};

export default Home;
