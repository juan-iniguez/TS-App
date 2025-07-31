const today = new Date();
const btnsReportOptions = document.getElementsByClassName('report-option')

for(let n of btnsReportOptions){
  n.addEventListener('click', selectReport);
}

document.getElementById("report-modal").addEventListener('click', (e)=>{
  // console.log(e);
  // console.log(e.target == document.getElementById("report-modal"));
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

  // console.log(data[1].datasets[0].data);
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

  // Sharing Properties

  let el = ``;
  const div = document.createElement('div');
  const btn = document.createElement('a');
  const header = document.createElement('div');


  switch (id) {
    case "report1":
    case "report3":
      el = `
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

      btn.className = 'btn btn-primary';
      btn.innerText = "Submit";
      btn.addEventListener('click',id=="report1"?submitReport1:submitReport3);

      div.className = "form-cont";
      div.innerHTML = el;
      
      header.style = "display:inherit;width:100%;justify-content:center;align-items: center;";
      header.innerHTML = `
        <h1 class="modal-title fs-5" id="exampleModalLabel">${id=="report1"?"Create Main Report 🏆":"Create Accruals Report 📘"}</h1>
        <button id="btn-close" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      `

      // Create your modal
      modal.modalHeader(header);
      modal.modalBody(div);
      modal.modalFooter(btn);
      setTimeout(()=>{
        const dateInputs = document.getElementsByClassName('date-input');
        dateInputs[1].valueAsNumber = new Date().getTime();
        dateInputs[1].setAttribute('max', dateInputs[1].value);
        dateInputs[0].setAttribute('max', dateInputs[1].value);
        dateInputs[0].addEventListener('change',setMinDate);
        dateInputs[1].addEventListener('change', setMaxDate);
        document.getElementById('btn-close').addEventListener('click',(e)=>{
          setTimeout(restoreModal,100);
        })  
      },200);
      break;
    case "report2":

      el = `
        <h1 style="font-size:1em;">Upload the APL Quarterly PAID Exception Report (.csv)</h1>
        <div class="input-group mb-3 middle-flex">
          <label class="input-group-text" for="exception-report" id="exception-report-label">Upload</label>
          <input class="file-input" id="exception-report" type="file">
        </div>
      `

      btn.className = 'btn btn-primary';
      btn.innerText = "Submit";
      btn.addEventListener('click',submitReport2);

      div.className = "form-cont";
      div.innerHTML = el;
      
      header.style = "display:inherit;width:100%;justify-content:center;align-items: center;";
      header.innerHTML = `
        <h1 class="modal-title fs-5" id="exampleModalLabel">Create Discount Report 📗</h1>
        <button id="btn-close" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      `

      // Create your modal
      modal.modalHeader(header);
      modal.modalBody(div);
      modal.modalFooter(btn);
      
      setTimeout(()=>{
        document.getElementById('btn-close').addEventListener('click',(e)=>{
          setTimeout(restoreModal,100);
        })  
      },100)


      /**
       * Discount report needs you to submit a CSV to the DB. 
       * The CSV will contain multiple BOL's and APL-INV#
       * It will also contain:
       *  + BOL
       *  + APL Inv#
       *  - Origin
       *  - Load Port
       *  - Discharge Port
       *  - Destination Name
       *  - Cargo Ocean Freight Amount
       * 
       * We are using the BOL to pull and cross reference shipments.
       * 0. Create a UI to send CSV's to the endpoint
       * 1. Send the CSV to Server Back End
       *    1. Ingest APL CSV into Object[]
       *    2. Use Object[] and map each row
       *    3. Use the BOL to pull the localInvoices[] from DB
       *    4. Validate that information is right (OCF, Ports, Inv#)
       *    5. Use the localInvoices[] and push to a allLocalInvoices[] var.
       *    6. Collect all localInvoices[] that match.
       *    7. Format to CSV and send to client
       * 2. Receive CSV
       *    1. Format to receive as CSV and download to files. (HARD)
       *    2. restoreModal()
       * 
       */
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

  // Validate files exist and they are .csv
  console.log("%cReport 2: TSP Discount", "background-color: purple;font-size:1.5em;")
  const file = document.getElementById('exception-report');
  console.log(file.files);

  function error_(msg){
    console.error("An Error Ocurred: " + msg)
    const modalFooter = document.getElementsByClassName('modal-footer')[0];
    const p = document.createElement('p')
    modalFooter.insertAdjacentElement('beforeend',p);
    p.innerText = "Please Add a File";
    p.style = "color:red;width:auto;text-align:left";
    file.addEventListener('focus', removeWarning)
    
    function removeWarning(){
      if(p == undefined){
        this.removeEventListener('focus',removeWarning)
        return
      };
      p.remove();
      this.removeEventListener('focus',removeWarning)
    }

  }


  if(file.files.length == 0 ){
    error_("No files have been selected")
  }else if(file.files.length>1){
    error_("There is more than 1 file")
  }else{
    let formData = new FormData();

    file.files[0].arrayBuffer
    formData.append("files", file.files[0]);

    axios.post('/api/reports/discountreport', formData, {
        'Content-Type': 'multipart/form-data'
    }).then(res=>{
      console.log(res);
    }).catch(err=>{
      console.error(err);
    })

  }
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
  footer.style = `width:100%;text-align:center;`
  footer.innerText = `Choose a Report Type`
  
  const header = document.createElement('div');
  header.style = "display:inherit;width:100%;justify-content:center;align-items: center;";
  header.innerHTML = `
    <h1 class="modal-title fs-5" id="exampleModalLabel">Create a Report</h1>
    <button id="btn-close" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
  `

  const div = document.createElement('div');
  div.className = 'report-select';
  div.innerHTML = mainModal;

  const modal = new reportModal("main");
  modal.modalHeader(header);
  modal.modalBody(div);
  modal.modalFooter(footer);

  setTimeout(()=>{
    for(let n of document.getElementsByClassName('report-option')){
      console.log(n);
      n.addEventListener('click', selectReport);
    }
    document.getElementById('btn-close').addEventListener('click',(e)=>{
      restoreModal();
    })
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