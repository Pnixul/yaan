"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, MapPin, Search, X } from "lucide-react";
import { MOCK_LOCATIONS, type MockLocation } from "@/lib/mock-locations";

export function LocationSearch({
  onSelect,
  onOpen,
}: {
  onSelect: (location: MockLocation) => void;
  onOpen: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const matches = MOCK_LOCATIONS.filter((location) =>
    `${location.name} ${location.thaiName} ${location.district} ${location.place} Bangkok กรุงเทพมหานคร`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  function select(location: MockLocation) {
    onSelect(location);
    setQuery("");
    setOpen(false);
    setActive(-1);
    input.current?.focus();
  }

  return (
    <div
      className="location-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form
        role="search"
        className="search-field"
        onSubmit={(event) => {
          event.preventDefault();
          const match = matches[active >= 0 ? active : 0];
          if (open && match) select(match);
        }}
      >
        <Search size={21} aria-hidden="true" />
        <input
          ref={input}
          aria-label="Search demo locations in Bangkok"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="location-options"
          aria-activedescendant={
            open && active >= 0 ? `option-${matches[active]?.id}` : undefined
          }
          autoComplete="off"
          placeholder="Find your neighbourhood"
          value={query}
          onFocus={() => {
            setOpen(true);
            onOpen();
          }}
          onClick={() => {
            setOpen(true);
            onOpen();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((index) => {
                if (!matches.length) return -1;
                if (index < 0)
                  return event.key === "ArrowDown" ? 0 : matches.length - 1;
                return (
                  (index +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    matches.length) %
                  matches.length
                );
              });
            }
          }}
        />
        {query ? (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setActive(-1);
              input.current?.focus();
            }}
          >
            <X size={18} />
          </button>
        ) : (
          <span className="search-hint">Bangkok</span>
        )}
      </form>
      {open && (
        <div className="search-results">
          <p className="eyebrow">Explore a demo neighbourhood</p>
          <ul id="location-options" role="listbox" aria-label="Demo locations">
            {matches.map((location, index) => (
              <li key={location.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`option-${location.id}`}
                  aria-selected={active === index}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(location)}
                >
                  <span className="search-location-icon">
                    <MapPin size={19} />
                  </span>
                  <span>
                    <strong>
                      {location.name} <span lang="th">{location.thaiName}</span>
                    </strong>
                    <small>{location.district}, Bangkok</small>
                  </span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {!matches.length && (
            <p className="search-empty" role="status">
              No demo places match. Try Ari, Thong Lo, or Silom.
            </p>
          )}
          <p className="search-footnote">
            3 sample places · Search stays on this device
          </p>
        </div>
      )}
    </div>
  );
}
