/** Native constraints, with persistent French errors exposed to assistive technology. */
function explanation(field:HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement){
 if(field.validity.valueMissing)return field instanceof HTMLInputElement&&field.type==='checkbox'?'Votre accord est nécessaire pour transmettre ce formulaire.':'Complétez ce champ.';
 if(field.validity.typeMismatch)return field instanceof HTMLInputElement&&field.type==='email'?'Indiquez une adresse email complète, par exemple nom@exemple.fr.':'Indiquez un lien complet commençant par https://.';
 if(field.validity.rangeUnderflow)return 'La valeur minimale est '+field.getAttribute('min')+'.';
 if(field.validity.rangeOverflow)return 'La valeur maximale est '+field.getAttribute('max')+'.';
 if(field.validity.tooShort)return 'Indiquez au moins '+field.getAttribute('minlength')+' caractères.';
 return field.validationMessage||'Vérifiez cette réponse.';
}
document.addEventListener('invalid',event=>{
 const field=event.target;if(!(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement||field instanceof HTMLSelectElement)||!field.id)return;
 field.setAttribute('aria-invalid','true');const id=field.id+'-error';let error=document.getElementById(id);
 if(!error){error=document.createElement('p');error.id=id;error.className='form-error';error.setAttribute('role','alert');(field.closest('label')||field).insertAdjacentElement('afterend',error);}
 error.textContent=explanation(field);error.hidden=false;const descriptions=new Set((field.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));descriptions.add(id);field.setAttribute('aria-describedby',[...descriptions].join(' '));
},true);
document.addEventListener('input',event=>{
 const field=event.target;if(!(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement||field instanceof HTMLSelectElement))return;
 if(field.validity.valid){field.removeAttribute('aria-invalid');const error=document.getElementById(field.id+'-error');if(error)error.hidden=true;}
});
