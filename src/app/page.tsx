import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CloudSun,
  Coffee,
  Footprints,
  MapPin,
} from "lucide-react";
import { HomeSearch } from "@/components/home-search";
import { MOCK_AREAS } from "@/lib/mock-locations";
import "./home.css";

const examples = [
  { id: "ari", description: "Start with a station, home or workspace." },
  { id: "thong-lo", description: "Look around a place along Sukhumvit." },
  { id: "lat-krabang", description: "Explore everyday life around a campus." },
];

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1} className="home-page">
      <div className="home-intro">
        <section className="home-hero" aria-labelledby="home-title">
          <p className="eyebrow">
            <MapPin size={14} /> A little context. A better sense of place.
          </p>
          <h1 id="home-title">
            A place is more
            <br />
            than an <em>address.</em>
          </h1>
          <p className="home-lede">
            Get to know life around a location. Find everyday places, see how
            far they are, and understand the area’s history.
          </p>
          <div className="home-search-section">
            <h2>Where would you like to explore?</h2>
            <HomeSearch />
          </div>
        </section>
        <section className="home-examples" aria-labelledby="examples-title">
          <div className="examples-heading">
            <span className="eyebrow">A starting point</span>
            <span className="examples-city">
              Bangkok <span lang="th">กรุงเทพฯ</span>
            </span>
          </div>
          <h2 id="examples-title">Try a neighbourhood.</h2>
          <p>Choose an area, then find your place in it.</p>
          <div className="example-locations">
            {examples.map((example, index) => {
              const area = MOCK_AREAS.find((area) => area.id === example.id)!;
              return (
                <Link
                  key={area.id}
                  href={`/explore?area=${area.id}`}
                  className="example-location"
                >
                  <span className="example-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span>
                    <strong>
                      {area.name} <span lang="th">{area.thaiName}</span>
                    </strong>
                    <small>{example.description}</small>
                  </span>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
          <p className="examples-note">
            Sample places and context, ready to explore.
          </p>
        </section>
      </div>
      <section className="home-context" aria-labelledby="context-title">
        <div className="home-context-heading">
          <p className="eyebrow">Beyond the address</p>
          <h2 id="context-title">Picture your everyday.</h2>
          <p>Whether it’s somewhere new or the place you already call home.</p>
        </div>
        <div className="home-context-list">
          <article>
            <Coffee size={23} strokeWidth={1.5} />
            <h3>The things you need</h3>
            <p>
              Food, transport, parks and everyday essentials around your
              reference location.
            </p>
          </article>
          <article>
            <Footprints size={23} strokeWidth={1.5} />
            <h3>A sense of distance</h3>
            <p>
              Approximate travel times and route previews to put nearby places
              in perspective.
            </p>
          </article>
          <article>
            <CloudSun size={23} strokeWidth={1.5} />
            <h3>The area’s story</h3>
            <p>
              Look at historical flood reports, with the context and limitations
              kept in view.
            </p>
          </article>
        </div>
        <Link className="home-explore-link" href="/explore">
          Open Explore <ArrowRight size={18} />
        </Link>
      </section>
      <footer className="home-footer">
        <p>
          <span lang="th">ย่าน</span> YAAN means neighbourhood.
        </p>
        <p>
          A working prototype with sample data.
          <br />
          Explore freely. No sign-in needed.
        </p>
      </footer>
    </main>
  );
}
