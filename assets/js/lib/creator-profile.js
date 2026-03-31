/**
 * CreatorProfile — shared utility for all 20 creator tools
 * Reads onboarding data + AfroAuth user, returns unified profile
 */
!function(){"use strict";
window.CreatorProfile={
  get:function(){
    var ext={};
    try{ext=JSON.parse(localStorage.getItem("afro_profile_extended")||"{}")}catch(e){}
    var user=window.AfroAuth&&window.AfroAuth.getUser?window.AfroAuth.getUser():null;
    return{
      userId:user&&user.id||null,
      name:user&&user.name||null,
      email:user&&user.email||null,
      country:ext.country_code||"ng",
      currency:ext.currency||"NGN",
      craft:ext.craft||null,
      platforms:ext.platforms||[],
      employment:ext.employment_type||null,
      isLoggedIn:!!user,
      isPro:window.AfroAuth&&window.AfroAuth.isPro?window.AfroAuth.isPro():false
    };
  }
};
}();
