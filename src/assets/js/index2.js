import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const works = document.querySelector('.works');
const hero = document.querySelector('.hero');

if (works && hero) {
  gsap.to(works, {
    y: () => -(hero.offsetHeight + document.querySelector('.business_panels').offsetHeight),
    ease: 'none',
    scrollTrigger: {
      trigger: '.overlap_wrap',
      start: 'top bottom',
      end: 'top top',
      scrub: 1,
    },
  });
}
