import { useActionData } from "@remix-run/react";
import { useEffect } from "react";

import { useToast } from "~/atoms/toast/hooks";

export function RouteToaster() {
  const actionData = useActionData<{ error?: string }>();
  const toast = useToast();

  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [toast, actionData]);

  return null;
}
