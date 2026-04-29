import type { JSX } from "react";

import SiteNav from "../../components/SiteNav/SiteNav";
import "./aboutUs.css";

type PersonCard = {
  name: string;
  role: string;
  image: string;
};

type ProductCard = {
  title: string[];
  image: string;
  titleClassName: string;
  href: string;
};

const founders: PersonCard[] = [
  {
    name: "Geethan",
    role: "Managing Director",
    image: "/about-us/geethan-color.png",
  },
  {
    name: "Anuradha Kannan",
    role: "Director",
    image: "/about-us/director-color-base.png",
  },
];

const coaches: PersonCard[] = [
  {
    name: "Geethan",
    role: "Managing Director",
    image: "/about-us/geethan-bw.png",
  },
  {
    name: "Anuradha Kannan",
    role: "Director",
    image: "/about-us/coach-anuradha-bw.png",
  },
  {
    name: "Geethan",
    role: "Managing Director",
    image: "/about-us/geethan-speaking.png",
  },
  {
    name: "Anuradha Kannan",
    role: "Director",
    image: "/about-us/coach-anuradha-office.png",
  },
];

const products: ProductCard[] = [
  {
    title: ["NICCS", "(A Career By Choice)"],
    image: "/about-us/product-niccs.png",
    titleClassName: "about-us-product-title--teal",
    href: "https://www.nibbanaindia.com/services/niccs",
  },
  {
    title: ["Become a Workplace", "Informed Counsellor"],
    image: "/about-us/product-counsellor.png",
    titleClassName: "about-us-product-title--coral",
    href: "https://www.nibbanaindia.com/services/workplace-informed-counselling",
  },
  {
    title: ["Become a", "Globally Recognised", "Executive Coach"],
    image: "/about-us/product-coach.png",
    titleClassName: "about-us-product-title--blue",
    href: "https://www.nibbanaindia.com/services/executive-coach",
  },
];

const footerLinks = [
  { href: "https://www.facebook.com", label: "Facebook", icon: "/about-us/icon-facebook.png" },
  { href: "https://www.linkedin.com", label: "LinkedIn", icon: "/about-us/icon-linkedin.png" },
  { href: "https://www.instagram.com", label: "Instagram", icon: "/about-us/icon-instagram.png" },
  { href: "https://www.youtube.com", label: "YouTube", icon: "/about-us/icon-youtube.png" },
];

function PersonCard({ name, role, image }: PersonCard): JSX.Element {
  return (
    <article className="about-us-person-card">
      <img className="about-us-person-image" src={image} alt={name} />
      <div className="about-us-person-label">
        {name} - {role}
      </div>
    </article>
  );
}

export default function AboutUs(): JSX.Element {
  return (
    <main className="about-us-page">
      <SiteNav
        items={[
          { label: "Podcast", href: "/home2#podcast" },
          { label: "Materials", href: "/home2#materials" },
          { label: "Self Help Resources", href: "/home2#selfhelp" },
          { label: "About Us", href: "/about-us" },
        ]}
        cta={{ label: "Subscribe Now", href: "/home2" }}
      />

      <div className="about-us-section-shell">
        <div className="about-us-section about-us-section--intro">
          <h1 className="about-us-section-title">About Us</h1>

          <div className="about-us-founders">
            {founders.map((person) => (
              <PersonCard key={`${person.name}-${person.role}`} {...person} />
            ))}
          </div>

          <p className="about-us-copy">
            Hi, we are Anu and Geethan, founders of Nibbana India - a leadership consulting and
            coaching practice focused on business transformation, executive development and
            organisational effectiveness, and Shrunothi - a curated leadership learning platform
            that delivers podcasts and resources centered on reflective listening and self
            development.
          </p>
        </div>
      </div>

      <div className="about-us-section-shell">
        <div className="about-us-section about-us-section--coaches">
          <h2 className="about-us-section-title">Our Coaches</h2>
          <div className="about-us-coaches">
            {coaches.map((person, index) => (
              <PersonCard key={`${person.name}-${person.role}-${index}`} {...person} />
            ))}
          </div>
        </div>
      </div>

      <div className="about-us-section-shell">
        <div className="about-us-section about-us-section--products">
          <h2 className="about-us-section-title">Explore Our Other Products</h2>

          <div className="about-us-products">
            {products.map((product) => (
              <article key={product.image} className="about-us-product-card">
                <img
                  className="about-us-product-background"
                  src={product.image}
                  alt={product.title.join(" ")}
                />
                <div className={`about-us-product-title ${product.titleClassName}`}>
                  {product.title.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
                <a
                  className="about-us-product-button"
                  href={product.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Learn more about ${product.title.join(" ")}`}
                >
                  Learn More
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>

      <footer className="about-us-footer">
        <div className="about-us-footer-inner">
          <img className="about-us-footer-logo" src="/about-us/logo.png" alt="Shrunothi" />

          <div className="about-us-footer-social">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
              >
                <img src={link.icon} alt="" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
