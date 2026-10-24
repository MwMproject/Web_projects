import AConstruire from "@/components/AConstruire";

export default function Page() {
  return (
    <AConstruire
      titre="Équipe"
      description="Membres, rôles et coûts horaires"
      points={["Inviter un ouvrier par e-mail ou SMS", "Rôles patron / bureau / ouvrier", "Coût horaire interne (table membre_couts, invisible aux ouvriers)", "Assigner les ouvriers aux chantiers"]}
    />
  );
}
