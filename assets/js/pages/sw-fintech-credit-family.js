(function(){
  'use strict';
  var form=document.querySelector('[data-sw-fintech-credit-form]');
  if(!form)return;
  var result=form.querySelector('.results');
  var error=form.querySelector('.form-error');
  function clear(){if(result)result.classList.remove('on');if(error)error.textContent='';}
  form.addEventListener('input',clear);
  form.addEventListener('change',clear);
  form.addEventListener('submit',function(event){
    event.preventDefault();clear();
    if(!form.checkValidity()){form.reportValidity();return;}
    var calculate=window[form.getAttribute('data-calculate')];
    if(typeof calculate==='function')calculate();
  });
}());
