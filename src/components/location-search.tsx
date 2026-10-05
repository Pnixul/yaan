"use client";

import { useI18n } from "@/components/i18n";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, MapPin, Search, X } from "lucide-react";
import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  normalizeQuery,
  type Location,
} from "@/lib/location";
import {
  requestLocations,
  type SearchState,
} from "@/lib/location-search-request";

export function LocationSearch({
  onSelect,
  onOpen,
}: {
  onSelect: (location: Location) => void;
  onOpen?: () => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [composing, setComposing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<SearchState>({
    query: "",
    status: "idle",
    locations: [],
  });
  const normalized = normalizeQuery(query);
  useEffect(() => {
    if (!open || composing) return;
    return requestLocations(normalized, setResult);
  }, [normalized, open, composing, attempt]);
  const current = result.query === normalized && !composing;
  const matches = current && result.status === "ready" ? result.locations : [];
  const status =
    normalized.length < MIN_QUERY_LENGTH
      ? "idle"
      : current
        ? result.status
        : "loading";
  const showResults = open && query.trim().length > 0;
  const activeId = matches[active] ? `${listId}-${active}` : undefined;

  useEffect(() => {
    if (open && activeId) {
      document.getElementById(activeId)?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [open, activeId]);

  function select(location: Location) {
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
          aria-label={t("Search locations in Bangkok")}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={showResults ? listId : undefined}
          aria-activedescendant={showResults ? activeId : undefined}
          autoComplete="off"
          maxLength={MAX_QUERY_LENGTH}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          placeholder={t("Find an area or a place")}
          value={query}
          onFocus={() => {
            setOpen(true);
            setActive(-1);
            if (query.trim()) onOpen?.();
          }}
          onClick={() => {
            setOpen(true);
            if (query.trim()) onOpen?.();
          }}
          onChange={(event) => {
            if (!showResults && event.target.value.trim()) onOpen?.();
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!query.trim()) return;
              setOpen(true);
              if (!showResults) onOpen?.();
              setActive((index) => {
                if (!matches.length) return -1;
                if (!showResults || index < 0)
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
            aria-label={t("Clear search")}
            onClick={() => {
              setQuery("");
              setOpen(false);
              setActive(-1);
              input.current?.focus();
            }}
          >
            <X size={18} />
          </button>
        ) : (
          <span className="search-hint">{t("Bangkok")}</span>
        )}
      </form>
      {showResults && (
        <div className="search-results">
          <p className="eyebrow">{t("Areas & places")}</p>
          <ul
            id={listId}
            role="listbox"
            aria-label={t("Locations")}
            aria-busy={status === "loading"}
          >
            {matches.map((location, index) => (
              <li key={location.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`${listId}-${index}`}
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
                      {location.name}
                      {location.englishName &&
                        location.englishName !== location.name && (
                          <span lang="en"> {location.englishName}</span>
                        )}
                    </strong>
                    <small>{location.address}</small>
                  </span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {!matches.length && (
            <p className="search-empty" role="status">
              {t(
                status === "idle"
                  ? "Type at least 2 characters to search."
                  : status === "loading"
                    ? "Searching Bangkok…"
                    : status === "error"
                      ? "Search is unavailable. Please try again."
                      : "No locations found. Try another name or address in Bangkok.",
              )}
            </p>
          )}
          {status === "error" && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setAttempt((value) => value + 1);
                input.current?.focus();
              }}
            >
              {t("Retry search")}
            </button>
          )}
          <p className="search-footnote">
            {t("Location search by Geoapify")} ·{" "}
            <a href="https://www.openstreetmap.org/copyright">
              {t("© OpenStreetMap contributors")}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
