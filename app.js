const R = 268;
const svg = d3.select("#globe");
const info = document.getElementById("info");
const proj = d3.geoOrthographic().scale(R).translate([300, 300]).rotate([-10, -25]).clipAngle(90);
const path = d3.geoPath(proj), grat = d3.geoGraticule10(), sphere = { type: "Sphere" };
let spin = !matchMedia("(prefers-reduced-motion:reduce)").matches;
let land, mk;

Promise.all([d3.json("data/countries.json"), d3.json("data/borders.geojson")])
    .then(([countries, borders]) => init(countries, borders))
    .catch(() => { info.innerHTML = '<p class="hint">Could not load the data files. Open the page through a local server (see README).</p>'; });

function init(countries, borders) {
    land = svg.select("#land").selectAll("path").data(borders.features).join("path").attr("class", "land");
    mk = svg.select("#mks").selectAll("g").data(countries).join("g")
        .attr("class", "mk").attr("tabindex", 0).attr("role", "button")
        .attr("aria-label", d => d.name + ": " + d.festival);
    mk.append("circle").attr("class", "halo").attr("r", 15);
    mk.append("circle").attr("class", "core").attr("r", 6);
    mk.on("click", (e, d) => show(d)).on("keydown", (e, d) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(d); }
    });
    d3.select("#chips").selectAll("button").data(countries).join("button")
        .attr("type", "button").text(d => d.name).on("click", (e, d) => show(d));
    svg.call(d3.drag().on("start", () => { spin = false; }).on("drag", e => {
        const r =proj.rotate();
        proj.rotate([r[0] + e.dx * .4, Math.max(-70, r[1] - e.dy * .4)]);
        draw();         
}));
    d3.timer(() => { if (spin) { const r = proj.rotate(); proj.rotate([r[0] + .15, r[1]]); draw(); } });
    draw();
}

function draw() {
    svg.select(".sph").attr("d", path(sphere));
    svg.select(".grat").attr("d", path(grat));
    land.attr("d", path);
    const r = proj.rotate(), ctr = [-r[0], -r[1]];
    mk.each(function (d) {
        const c = [d.lon, d.lat], hide = d3.geoDistance(c, ctr) > 1.5;
        d3.select(this).attr("transform", "translate(" + proj(c) + ")").style("display", hide ? "none" : null);
    });
}

function show(d) {
    spin = false;
    info.innerHTML = "";
    [["h2", d.name], ["p", d.when, "when"], ["h3", d.festival], ["p", d.text]].forEach(([tag, txt, cls]) => {
        const e = document.createElement(tag); 
        e.textContent = txt;
        if (cls) e.className = cls; 
        info.appendChild(e);
    });
    mk.classed("on", m => m === d);
    land.classed("on", f => f.properties.id === d.id);
    d3.selectAll(".chips button").classed("on", b => b === d);
    const ip = d3.interpolate(proj.rotate(), [-d.lon, -d.lat * 0.8]);
    d3.transition().duration(900).ease(d3.easeCubicInOut).tween("r", () => t => { proj.rotate(ip(t)); draw(); });
}
