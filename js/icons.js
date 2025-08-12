
export function icon(name, size=18){
  const NS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(NS,"svg");
  svg.setAttribute("viewBox","0 0 24 24");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("fill","none");
  svg.setAttribute("stroke","currentColor");
  svg.setAttribute("stroke-width","2");
  svg.setAttribute("stroke-linecap","round");
  svg.setAttribute("stroke-linejoin","round");
  svg.classList.add("icon");
  const paths={
    plus:[["path",{d:"M12 5v14M5 12h14"}]],
    trash:[["polyline",{points:"3 6 5 6 21 6"}],["path",{d:"M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"}],["path",{d:"M10 11v6M14 11v6"}],["path",{d:"M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"}]],
    camera:[["path",{d:"M23 19V8a3 3 0 0 0-3-3h-3l-2-2h-4l-2 2H6a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3Z"}],["circle",{cx:"12",cy:"13",r:"4"}]],
    image:[["rect",{x:"3",y:"5",width:"18",height:"14",rx:"2"}],["circle",{cx:"8",cy:"9",r:"2"}],["path",{d:"m21 15-5-5L5 21"}]],
    mail:[["path",{d:"M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"}],["path",{d:"m22 6-10 7L2 6"}]],
    open:[["path",{d:"M15 3h6v6"}],["path",{d:"M10 14 21 3"}],["path",{d:"M21 21H3V3"}]],
    checkCircle:[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}],["polyline",{points:"22 4 12 14.01 9 11.01"}]],
    chevronLeft:[["path",{d:"M15 18l-6-6 6-6"}]],
    chevronRight:[["path",{d:"M9 18l6-6-6-6"}]],
    mapPin:[["path",{d:"M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"}],["circle",{cx:"12",cy:"10",r:"3"}]],
    mapAdd:[["path",{d:"M12 5v14M5 12h14"}],["path",{d:"M3 11l9-7 9 7-9 7-9-7z"}]],
    mapRemove:[["path",{d:"M5 12h14"}],["path",{d:"M3 11l9-7 9 7-9 7-9-7z"}]],
    calendar:[["rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}],["path",{d:"M16 2v4M8 2v4M3 10h18"}]],
    user:[["path",{d:"M20 21a8 8 0 0 0-16 0"}],["circle",{cx:"12",cy:"7",r:"4"}]],
    refresh:[["path",{d:"M21 12a9 9 0 1 1-3-6.7"}],["path",{d:"M21 3v7h-7"}]],
    lock:[["rect",{x:"3",y:"11",width:"18",height:"11",rx:"2"}],["path",{d:"M7 11V8a5 5 0 0 1 10 0v3"}]],
    x:[["path",{d:"M18 6 6 18"}],["path",{d:"M6 6 18 18"}]]
  };
  for(const [tag,attrs] of (paths[name]||paths.plus)){
    const e=document.createElementNS(NS,tag);
    for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,v);
    svg.appendChild(e);
  }
  return svg;
}
