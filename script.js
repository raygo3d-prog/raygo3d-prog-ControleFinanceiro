// Sample data and chart rendering
const sampleTx = [
  ['2024-10-28','Venda - HOMEM E 2 CACHORROS','Produto','Entrada',329.70],
  ['2024-11-08','Canetinhas','Insumos','Saída',-45.47],
  ['2024-11-08','Plástico Bolha','Embalagem','Saída',-30.90],
  ['2024-11-09','Isopor','Embalagem','Saída',-10.00],
  ['2024-11-15','Venda Pedido X','Produto','Entrada',149.90],
  ['2024-11-20','Filamento PLA','Filamento','Saída',-120.00],
];

function formatBR(val){
  return val.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}

function populateTable(){
  const tbody = document.querySelector('#txTable tbody');
  tbody.innerHTML='';
  sampleTx.forEach(r=>{
    const tr = document.createElement('tr');
    r.forEach((c,i)=>{
      const td = document.createElement('td');
      td.textContent = (i===4)?formatBR(c):c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  // indicators
  const entradas = sampleTx.filter(r=>r[4]>0).reduce((s,r)=>s+r[4],0);
  const saidas = sampleTx.filter(r=>r[4]<0).reduce((s,r)=>s+r[4],0);
  const saldo = entradas+saidas;
  const lucro = sampleTx.filter(r=>r[3]==='Entrada').reduce((s,r)=>s+r[4],0) -  // simplistic
                sampleTx.filter(r=>r[3]==='Entrada').reduce((s,r)=>s+(r[2]==='Produto'?0:r[4]),0);
  document.getElementById('entradas').textContent = formatBR(entradas);
  document.getElementById('saidas').textContent = formatBR(saidas);
  document.getElementById('saldo').textContent = formatBR(saldo);
  document.getElementById('lucro').textContent = formatBR(entradas); // placeholder
}

function renderCharts(){
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const entradasByMonth = Array(12).fill(0);
  const saidasByMonth = Array(12).fill(0);
  sampleTx.forEach(r=>{
    const d = new Date(r[0]);
    const m = d.getMonth();
    if(r[4]>0) entradasByMonth[m]+=r[4]; else saidasByMonth[m]+=Math.abs(r[4]);
  });

  const ctx = document.getElementById('barChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Entradas', data: entradasByMonth, stack: 'a' },
        { label: 'Saídas', data: saidasByMonth, stack: 'a' }
      ]
    },
    options:{responsive:true,maintainAspectRatio:false}
  });

  const catTotals = {};
  sampleTx.forEach(r=>{ const c=r[2]; catTotals[c]=(catTotals[c]||0)+Math.abs(r[4]); });
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  new Chart(pieCtx, {
    type:'pie',
    data:{
      labels: Object.keys(catTotals),
      datasets:[{data:Object.values(catTotals)}]
    },
    options:{responsive:true,maintainAspectRatio:false}
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  populateTable();
  renderCharts();
});