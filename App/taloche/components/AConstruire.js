// Page provisoire : indique ce que l'écran devra faire (cahier des charges vivant).
export default function AConstruire({ titre, description, points = [] }) {
  return (
    <>
      <h1>{titre}</h1>
      <p className="sous-titre">{description}</p>
      <div className="carte">
        <strong>À construire</strong>
        <ul>{points.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
    </>
  );
}
