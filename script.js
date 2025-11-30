
// Lightweight integration: parse Excel (SheetJS) and render charts (Chart.js)
// Works fully client-side — no data leaves your browser.
const fileInput = document.getElementById('file');
const status = document.getElementById('status');
const sampleBtn = document.getElementById('sampleBtn');

let txData = []; // transactions array of objects {date, desc, category, type, value, client, product}

fileInput.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  status.textContent = 'Lendo arquivo...';
  const reader = new FileReader();
  reader.onload = (ev)=>{
    const data = new Uint8Array(ev.target.result);
    const workbook = XLSX.read(data, {type:'array'});
    // Prefer sheet named Data_Transacoes or first sheet
    const sheetName = workbook.SheetNames.includes('Data_Transacoes')? 'Data_Transacoes' : workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(ws, {raw:false, defval: ''});
    parseTransactions(json);
    status.textContent = 'Arquivo carregado: ' + f.name;
  };
  reader.readAsArrayBuffer(f);
});

sampleBtn.addEventListener('click', ()=>{
  const sample = [
    {Data:'2024-10-28',Descrição:'HOMEM E 2 CACHORROS CARTOON',Categoria:'Produto',Tipo:'Entrada',Valor:329.70,Cliente:'Aline',Produto:'HOMEM E 2 CACHORROS'},
    {Data:'2024-11-08',Descrição:'CANETINHAS',Categoria:'Insumos',Tipo:'Saída',Valor:-45.47,Cliente:'',Produto:''},
    {Data:'2024-11-08',Descrição:'PLASTICO BOLHA',Categoria:'Embalagem',Tipo:'Saída',Valor:-30.90,Cliente:'',Produto:''},
    {Data:'2024-11-09',Descrição:'ISOPOR',Categoria:'Embalagem',Tipo:'Saída',Valor:-10.00,Cliente:'',Produto:''},
    {Data:'2024-11-15',Descrição:'Venda Pedido X',Categoria:'Produto',Tipo:'Entrada',Valor:149.90,Cliente:'Marcus Vinicius',Produto:'Produto X'},
    {Data:'2024-11-20',Descrição:'Filamento PLA',Categoria:'Filamento',Tipo:'Saída',Valor:-120.00,Cliente:'',Produto:''},
  ];
  parseTransactions(sample);
  status.textContent='Dados de exemplo carregados.';
});

function parseTransactions(rows){
  txData = rows.map(r=>{
    // Normalize keys (support portuguese headers or english)
    const date = r.Data || r.data || r.Date || r.date;
    const desc = r.Descrição || r.Descricao || r.Description || r.description || r.Descrição || '';
    const cat = r.Categoria || r.Category || r.categoria || '';
    const tipo = r.Tipo || r.Type || (Number(r.Valor || r.Value) > 0 ? 'Entrada' : 'Saída') || '';
    const val = Number(String(r.Valor || r.Value || r.valor || 0).toString().replace(/[^0-9.-]+/g,'')) || 0;
    const client = r.Cliente || r.client || r.Client || '';
    const product = r.Produto || r.product || r.Product || '';
    return {date, desc, category:cat, type:tipo, value:val, client, product};
  });
  renderAll();
}

function renderAll(){
  renderTable();
  renderSales();
  renderIndicators();
  renderCharts();
}

function renderTable(){
  const tbody = document.querySelector('#txTable tbody');
  tbody.innerHTML='';
  txData.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date||''}</td><td>${r.desc||''}</td><td>${r.category||''}</td><td>${r.type||''}</td><td>${formatBR(r.value)}</td>`;
    tbody.appendChild(tr);
  });
}

function renderSales(){
  const tbody = document.querySelector('#salesTable tbody');
  tbody.innerHTML='';
  txData.filter(r=>r.type && r.type.toString().toLowerCase().includes('entrada') && (r.product||r.desc)).forEach((r,i)=>{
    const cost=0; // placeholder unless provided as column
    const lucro = r.value - cost;
    const margem = r.value? Math.round((lucro / r.value) * 10000)/100 : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date||''}</td><td>${r.product||r.desc||''}</td><td>${r.client||''}</td><td>${formatBR(cost)}</td><td>${formatBR(r.value)}</td><td>${formatBR(lucro)}</td><td>${margem}%</td>`;
    tbody.appendChild(tr);
  });
}

function renderIndicators(){
  const entradas = txData.filter(t=>t.value>0).reduce((s,t)=>s+t.value,0);
  const saidas = txData.filter(t=>t.value<0).reduce((s,t)=>s+t.value,0);
  const saldo = entradas + saidas;
  document.getElementById('entradas').textContent = formatBR(entradas);
  document.getElementById('saidas').textContent = formatBR(saidas);
  document.getElementById('saldo').textContent = formatBR(saldo);
  document.getElementById('lucro').textContent = formatBR(entradas); // placeholder
}

function renderCharts(){
  // Prepare monthly arrays
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const entradasByMonth = Array(12).fill(0);
  const saidasByMonth = Array(12).fill(0);
  txData.forEach(r=>{
    const d = new Date(r.date);
    if(isNaN(d)) return;
    const m = d.getMonth();
    if(r.value>0) entradasByMonth[m]+=r.value; else saidasByMonth[m]+=Math.abs(r.value);
  });
  // Bar chart
  const barCtx = document.getElementById('barChart').getContext('2d');
  if(window.barChart) window.barChart.destroy();
  window.barChart = new Chart(barCtx, {
    type:'bar',
    data:{
      labels:months,
      datasets:[
        {label:'Entradas',data:entradasByMonth,backgroundColor:'rgba(54,162,235,0.6)'},
        {label:'Saídas',data:saidasByMonth,backgroundColor:'rgba(255,99,132,0.6)'}
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}}}
  });
  // Pie chart for categories
  const catTotals = {};
  txData.forEach(r=>{ const c = r.category || 'Outros'; catTotals[c]=(catTotals[c]||0)+Math.abs(r.value); });
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  if(window.pieChart) window.pieChart.destroy();
  window.pieChart = new Chart(pieCtx, {
    type:'pie',
    data:{labels:Object.keys(catTotals),datasets:[{data:Object.values(catTotals)}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}
  });
}

function formatBR(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
