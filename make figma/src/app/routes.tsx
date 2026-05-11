import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Projets } from "./pages/Projets";
import { Planification } from "./pages/Planification";
import { RessourcesHumaines } from "./pages/RessourcesHumaines";
import { Comptabilite } from "./pages/Comptabilite";
import { Programme } from "./pages/Programme";
import { Formations } from "./pages/Formations";
import { CRMVentes } from "./pages/CRMVentes";
import { Trinite } from "./pages/Trinite";
import { Logistique } from "./pages/Logistique";
import { ParcAuto } from "./pages/ParcAuto";
import { Messagerie } from "./pages/Messagerie";
import { TicketIT } from "./pages/TicketIT";
import { DocsSenegel } from "./pages/DocsSenegel";
import { MoyensGeneraux } from "./pages/MoyensGeneraux";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "projets", Component: Projets },
      { path: "planification", Component: Planification },
      { path: "rh", Component: RessourcesHumaines },
      { path: "comptabilite", Component: Comptabilite },
      { path: "programme", Component: Programme },
      { path: "formations", Component: Formations },
      { path: "crm-ventes", Component: CRMVentes },
      { path: "trinite", Component: Trinite },
      { path: "logistique", Component: Logistique },
      { path: "parc-auto", Component: ParcAuto },
      { path: "messagerie", Component: Messagerie },
      { path: "ticket-it", Component: TicketIT },
      { path: "docs-senegel", Component: DocsSenegel },
      { path: "moyens-generaux", Component: MoyensGeneraux },
    ],
  },
]);
