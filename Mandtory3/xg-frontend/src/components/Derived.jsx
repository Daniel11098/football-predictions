const fmt = (v, digits = 1) => v.toFixed(digits).replace('.', ',')

export default function Derived({ shooter, geometry, opponentInfo }) {
  const rows = [
    ['Skytter (x, y)', `${fmt(shooter.x)}, ${fmt(shooter.y)}`],
    ['Avstand til mål', `${fmt(geometry.distance)} yd`],
    ['Skuddvinkel', `${fmt(geometry.angle)}°`],
    ['Synlig mål', `${fmt(geometry.visual)}°`],
    ['Skytter til keeper', `${fmt(geometry.shooterToKeeper)} yd`],
    ['Keeper fra mål', `${fmt(geometry.keeperToGoal)} yd`],
    ['Nærmeste motstander', opponentInfo.nearest === null ? 'ingen' : `${fmt(opponentInfo.nearest)} yd`],
    ['Motstandere innen 2,5 yd', opponentInfo.within25],
    ['Motstandere 2,5 til 5 yd', opponentInfo.from25to5],
    ['Motstandere 5 til 10 yd', opponentInfo.from5to10],
    ['Motstandere i skuddtrekanten', opponentInfo.inTriangle],
  ]

  return (
    <section className="section derived-block" aria-labelledby="derived-heading">
      <h2 id="derived-heading">Regnet ut fra banen</h2>
      <dl className="derived">
        {rows.map(([label, value]) => (
          <div key={label} className="derived-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="hint">
        Keeperen telles ikke som motstander. Skuddtrekanten går fra skytteren til de to stolpene.
      </p>
    </section>
  )
}
