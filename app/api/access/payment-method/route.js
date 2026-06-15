import { getProject, accessLevelFor, selectManualPayment } from "../../../../lib/access/store";
import { getSessionUser } from "../../../../lib/access/auth";
import { notifyJoe } from "../../../../lib/access/notify";
import { MANUAL_PAYMENT_METHODS, MANUAL_PAYMENT_NOTICE } from "../../../../lib/access/constants";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const { projectId, method } = await request.json().catch(() => ({}));
  const project = getProject(projectId);
  const level = accessLevelFor(user, project);
  if (!project || !["full", "billing"].includes(level)) {
    return Response.json({ ok: false, error: "No billing access on this project." }, { status: 403 });
  }
  if (!MANUAL_PAYMENT_METHODS.includes(method)) {
    return Response.json({ ok: false, error: "Pick a payment method." }, { status: 400 });
  }

  selectManualPayment(projectId, method);

  await notifyJoe(`Manual payment selected — ${project.propertyName}`, [
    `${user.name} (${user.email}) selected ${method}.`,
    `Project: ${project.propertyName} — ${project.address}`,
    "Confirm receipt from the admin dashboard to release the project.",
  ]);

  return Response.json({ ok: true, notice: MANUAL_PAYMENT_NOTICE });
}
