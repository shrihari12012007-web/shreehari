const typingElement=document.getElementById("typing");
const words=["CSE Student","Developer","AI Enthusiast","Problem Solver","Future Software Engineer"];
let wordIndex=0,charIndex=0,deleting=false;
function typeEffect(){
 const currentWord=words[wordIndex];
 if(!deleting){
  typingElement.textContent=currentWord.substring(0,charIndex+1); charIndex++;
  if(charIndex===currentWord.length){deleting=true;setTimeout(typeEffect,1600);return;}
 }else{
  typingElement.textContent=currentWord.substring(0,charIndex-1);charIndex--;
  if(charIndex===0){deleting=false;wordIndex=(wordIndex+1)%words.length;}
 }
 setTimeout(typeEffect,deleting?50:90);
}
typeEffect();

const menuBtn=document.getElementById("menuBtn");
const navMenu=document.getElementById("navMenu");
menuBtn.addEventListener("click",()=>{
 navMenu.classList.toggle("open");
 menuBtn.textContent=navMenu.classList.contains("open")?"✕":"☰";
});
document.querySelectorAll("#navMenu a").forEach(link=>{
 link.addEventListener("click",()=>{navMenu.classList.remove("open");menuBtn.textContent="☰";});
});

const sections=document.querySelectorAll("section");
const links=document.querySelectorAll(".navbar nav a");
window.addEventListener("scroll",()=>{
 let current="";
 sections.forEach(section=>{
  if(window.scrollY>=section.offsetTop-150) current=section.getAttribute("id");
 });
 links.forEach(link=>{
  link.classList.toggle("active",link.getAttribute("href")==="#"+current);
 });
});

const animatedElements=document.querySelectorAll(".section,.project-card,.skill-card,.contact-item");
const observer=new IntersectionObserver(entries=>{
 entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add("show");observer.unobserve(entry.target);}
 });
},{threshold:.12});
animatedElements.forEach(element=>observer.observe(element));

document.getElementById("year").textContent=new Date().getFullYear();
