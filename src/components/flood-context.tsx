"use client";
import {
  ArrowLeft,
  ArrowRight,
  CloudRain,
  Droplets,
  Info,
  MoveUpRight,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  formatReportDate,
  MONTHS,
  monthCounts,
  type MockArea,
  type MockReport,
} from "@/lib/mock-locations";
type Props = {
  location: MockArea;
  details: boolean;
  selectedReport: MockReport | null;
  onDetails: (show: boolean) => void;
  onReport: (report: MockReport) => void;
};
export function FloodContext({
  location,
  details,
  selectedReport,
  onDetails,
  onReport,
}: Props) {
  const counts = monthCounts(location.reports);
  const commonMonths = counts
    .map((count, index) => ({ count, index }))
    .filter(({ count }) => count > 1)
    .map(({ index }) => MONTHS[index])
    .join(" & ");
  const heading = useRef<HTMLHeadingElement>(null);
  const overviewButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (details) heading.current?.focus({ preventScroll: true });
  }, [details]);
  function showDetails(show: boolean) {
    onDetails(show);
    requestAnimationFrame(() =>
      show ? heading.current?.focus() : overviewButton.current?.focus(),
    );
  }
  return (
    <div className="flood-context">
      {details ? (
        <section className="detail-view">
          <button
            className="text-button back-button"
            onClick={() => showDetails(false)}
          >
            <ArrowLeft size={16} /> Flood overview
          </button>
          <h2 ref={heading} tabIndex={-1}>
            Behind the summary
          </h2>
          <p className="detail-intro">
            A closer look at the fictional reports shown on the map.
          </p>
          <div className="detail-disclaimer">
            <Info size={18} />
            <p>
              Every report below is invented. The risk category is a sample
              label, not a calculated assessment.
            </p>
          </div>
          <h3 className="section-label">
            Sample reports <span>{location.reports.length}</span>
          </h3>
          {location.reports.length ? (
            <ul className="report-list">
              {location.reports.map((report) => (
                <li key={report.id}>
                  <button
                    className={cn(
                      selectedReport?.id === report.id && "is-selected",
                    )}
                    onClick={() => onReport(report)}
                    aria-pressed={selectedReport?.id === report.id}
                  >
                    <span className="report-list-icon">
                      <Droplets size={17} />
                    </span>
                    <span>
                      <strong>{report.street}</strong>
                      <small>
                        {formatReportDate(report.date)} · Mock report
                      </small>
                    </span>
                    <MoveUpRight size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-reports">
              No reports in this sample. This is an absence of information, not
              evidence of low risk.
            </p>
          )}
          <div className="reading-note">
            <h3>Context, not a prediction.</h3>
            <p>
              The shaded shape only illustrates a surrounding area. It is not a
              flood extent or a validated analysis boundary. Historical
              information cannot guarantee future conditions at a building.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section
            className={cn(
              "risk-summary",
              !location.reports.length && "risk-unknown",
            )}
            aria-label="Illustrative flood risk"
          >
            <div className="risk-title">
              <span className="risk-icon">
                <CloudRain size={22} strokeWidth={1.6} />
              </span>
              <div>
                <p>Illustrative flood risk</p>
                <h2>{location.category}</h2>
              </div>
            </div>
            <p className="risk-explanation">{location.explanation}</p>
            <span className="risk-caption">
              Area-level example · Not a forecast
            </span>
          </section>
          <div className="supporting-indicators">
            <div>
              <span className="indicator-label">
                <Droplets size={15} /> Historical reports
              </span>
              <strong>
                {location.reports.length.toString().padStart(2, "0")}
                <small> mock reports</small>
              </strong>
              <p>In the illustrated area</p>
            </div>
            <div>
              <span className="indicator-label">
                <CloudRain size={15} /> Common months
              </span>
              <strong className="month-value">
                {commonMonths || "Not available"}
              </strong>
              <p>
                {commonMonths ? "In this sample history" : "No sample history"}
              </p>
            </div>
          </div>
          <section
            className="seasonality"
            aria-label="Monthly distribution of fictional reports"
          >
            <div className="section-heading">
              <h2>A little seasonal context</h2>
              <span>2022–2024 · Sample</span>
            </div>
            <div
              className="month-chart"
              role="img"
              aria-label={counts
                .map((count, i) => `${MONTHS[i]}: ${count} mock reports`)
                .join(", ")}
            >
              {counts.map((count, i) => (
                <div
                  className={cn("month-column", count > 1 && "peak-month")}
                  key={MONTHS[i]}
                >
                  <div className="bar-track">
                    <span
                      style={{
                        height: count
                          ? `${(count / Math.max(...counts, 1)) * 100}%`
                          : "4px",
                      }}
                    />
                  </div>
                  <span>{MONTHS[i].slice(0, 1)}</span>
                </div>
              ))}
            </div>
            <p>
              {commonMonths ? (
                <>
                  More sample reports in{" "}
                  <strong>{commonMonths.toLowerCase()}.</strong>
                </>
              ) : (
                "There is not enough information to show a pattern."
              )}
            </p>
          </section>
          <button
            ref={overviewButton}
            className="primary-button"
            onClick={() => showDetails(true)}
          >
            Explore flood history <ArrowRight size={18} />
          </button>
          <div className="context-note">
            <Info size={16} />
            <p>
              Get to know the area, not predict the future. These examples are
              not a real flood assessment.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
