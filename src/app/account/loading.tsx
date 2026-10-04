import { Message } from "@/components/i18n";
export default function LoadingAccount() {
  return (
    <p className="account-message" role="status">
      <Message text={"Checking your account…"} />{" "}
    </p>
  );
}
