const today = new Date();
const btnsReportOptions = document.getElementsByClassName('report-option')

for(let n of btnsReportOptions){
  console.log(n);
  n.addEventListener('click', selectReport);
}

document.getElementById("report-modal").addEventListener('click', (e)=>{
  console.log(e);
  console.log(e.target == document.getElementById("report-modal"));
  if(e.target == document.getElementById("report-modal")){
    setTimeout(restoreModal,100)
  }
});

document.getElementById('btn-close').addEventListener('click',(e)=>{
      setTimeout(restoreModal,100)
})

axios.get('/api/reports/monthly/'+(today.getMonth()) + '/' + (today.getFullYear()))
.then(res=>{
  initGraph(res.data);
})
.catch(err=>{
  console.error(err);
})

function initGraph(data){
  const firstGraph = document.getElementById("chart-1")
  const secondGraph = document.getElementById("chart-2") 
  const infoTitles = document.getElementsByClassName('info-amount');

  // Bar Graph
  new Chart(firstGraph, {
      type: data[0].type,
      data: {
        labels: data[0].labels,
        datasets: data[0].datasets,
      },
      options: {
        interaction: {
          intersect: false,
        },
        plugins:{
          title:{
            display: true,
            text: data[0].title,
            font: {size:22}
          },
        },
        scales: {
          y: {
            stacked: true,
            ticks: {
              callback: function(value,index,values){
                return '$' + value.toFixed(2);
              }
            },
            beginAtZero: true
          },
          x: {
            stacked: true,
          }
        }
      }
    });

  new Chart(secondGraph, {
      type: data[1].type,
      data: {
        labels: data[1].labels,
        datasets: data[1].datasets
      },
      options: {
        responsive: true,
        plugins:{
          title:{
            display: true,
            text: data[1].title,
            font: {size:22}
          },
        },
      }
    });

  console.log(data[1].datasets[0].data);
  const aplTotalOCF = data[1].datasets[0].data[2] + data[1].datasets[0].data[1] + data[1].datasets[0].data[0];

    // APL OCF
  infoTitles[0].innerText = parseFloat(aplTotalOCF.toFixed(2)).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // TSP DISC
  infoTitles[1].innerText = parseFloat(data[1].datasets[0].data[0].toFixed(2)).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  
  // Company Discount
  infoTitles[2].innerText = parseFloat(data[1].datasets[0].data[1].toFixed(2)).toLocaleString('en-US', { style: 'currency', currency: 'USD' });


}

class reportModal {
  type;
  modalCont = document.getElementById('report-info');

  constructor(type){
    this.type = type;
  }

  sectionChange(section,e){
    section.classList.toggle("hidden");
    setTimeout(()=>{
      section.innerHTML = "";
      section.appendChild(e);
      setTimeout(()=>{
        section.classList.toggle("hidden");
      },100);
    },100);
  }

  modalHeader(e){
    const header = this.modalCont.children[0]
    this.sectionChange(header,e)
  }

  modalBody(e){
    const body = this.modalCont.children[1]
    this.sectionChange(body,e)
  }
  
  modalFooter(e){
    const footer = this.modalCont.children[2]
    this.sectionChange(footer,e)
  }
}

function selectReport(){
  const id = this.id
  const modal = new reportModal(id);

  switch (id) {
    case "report1":
    case "report3":
      const el = `
        <h1>Select a Date:</h1>
        <div class="date-form">
          <div class="input-group mb-3">
            <label class="input-group-text" for="start-date" id="end-date-label">Start</label>
            <input class="date-input" id="start-date" type="date">
          </div>
          <div class="input-group mb-3">
            <label class="input-group-text" for="end-date" id="end-date-label">End</label>
            <input class="date-input" id="end-date" type="date">
          </div>
        </div>`

      const div = document.createElement('div');
      const btn = document.createElement('a');
      btn.className = 'btn btn-primary';
      btn.innerText = "Submit";
      btn.addEventListener('click',id=="report1"?submitReport1:submitReport3);

      div.className = "form-cont";
      div.innerHTML = el;
      
      modal.modalBody(div);
      modal.modalFooter(btn);
      setTimeout(()=>{
        const dateInputs = document.getElementsByClassName('date-input');
        console.log(dateInputs)
        dateInputs[1].valueAsNumber = new Date().getTime();
        dateInputs[1].setAttribute('max', dateInputs[1].value);
        dateInputs[0].setAttribute('max', dateInputs[1].value);
        dateInputs[0].addEventListener('change',setMinDate);
        dateInputs[1].addEventListener('change', setMaxDate);
      },200);
      break;
    case "report2":
      break;
    default:
      break;
  }
}

function submitReport1(){
  const startDate = document.getElementById('start-date');
  const endDate = document.getElementById('end-date');
  if(startDate.value == null || startDate.value == "" || startDate.value == undefined || endDate.value == null || endDate.value == undefined || endDate.value == "" ){
    const modalFooter = document.getElementsByClassName('modal-footer')[0];
    const p = document.createElement('p')
    modalFooter.insertAdjacentElement('beforeend',p);
    p.innerText = "Please Select a Valid Date";
    p.style = "color:red;width:auto;text-align:left";
    startDate.addEventListener('focus',removeWarning)
    endDate.addEventListener('focus',removeWarning)
    
    function removeWarning(){
      if(p == undefined){
        this.removeEventListener('focus',removeWarning)
        return
      };
      p.remove();
      this.removeEventListener('focus',removeWarning)
    }

    return;
  }
  // console.log(new Date(startDate.value).getTime(),new Date(endDate.value).getTime());
  // console.log(startDate.valueAsNumber,endDate.valueAsNumber);
  window.open(`/api/reports/mainreport/${startDate.valueAsNumber}/${endDate.valueAsNumber+86400000}`, '_blank');

  document.getElementsByClassName('btn-close')[0].click()

  restoreModal();

}

function submitReport2(){
  console.log("Report 2: TSP Discount")
}

function submitReport3(){
  console.log("%cReport 3: Accruals", "font-size:24px;background-color:orange;color:black;")

  const startDate = document.getElementById('start-date');
  const endDate = document.getElementById('end-date');

  if(startDate.value == null || startDate.value == "" || startDate.value == undefined || endDate.value == null || endDate.value == undefined || endDate.value == "" ){
    const modalFooter = document.getElementsByClassName('modal-footer')[0];
    const p = document.createElement('p')
    modalFooter.insertAdjacentElement('beforeend',p);
    p.innerText = "Please Select a Valid Date";
    p.style = "color:red;width:auto;text-align:left";
    startDate.addEventListener('focus',removeWarning)
    endDate.addEventListener('focus',removeWarning)
    
    function removeWarning(){
      if(p == undefined){
        this.removeEventListener('focus',removeWarning)
        return
      };
      p.remove();
      this.removeEventListener('focus',removeWarning)
    }

    return;
  }

  window.open(`/api/reports/accruals/${startDate.valueAsNumber}/${endDate.valueAsNumber+86400000}`, '_blank');

  document.getElementsByClassName('btn-close')[0].click()

  restoreModal();


}

function restoreModal(){
  const mainModal = `
    <a id="report1" style="grid-area: report1;" class="report-option shadowbox">
      <h1 class="report-option-title">Main Report</h1>
      <p class="emoji">🏆</p>
    </a>
    <a id="report2" style="grid-area: report2;" class="report-option shadowbox">
      <h1 class="report-option-title">Discount Report</h1>
      <p class="emoji">📗</p>
    </a>
    <a id="report3" style="grid-area: report3;" class="report-option shadowbox">
      <h1 class="report-option-title">Accruals Report</h1>
      <p class="emoji">📘</p>
    </a>`

  const footer = document.createElement('p');
  footer.innerText = `
  Choose a Report Type
  `
  

  const div = document.createElement('div');
  div.className = 'report-select';
  div.innerHTML = mainModal;
  const modal = new reportModal("main");
  modal.modalBody(div);
  modal.modalFooter(footer);
  setTimeout(()=>{
    for(let n of document.getElementsByClassName('report-option')){
      console.log(n);
      n.addEventListener('click', selectReport);
    }
  },600)
}

function setMaxDate(){
  const dateInput = this;
  const dateInputs = document.getElementsByClassName('date-input');
  dateInputs[0].setAttribute('max', dateInput.value);
}

function setMinDate(){
  const dateInput = this;
  const dateInputs = document.getElementsByClassName('date-input');
  dateInputs[1].setAttribute('min', dateInput.value);
}