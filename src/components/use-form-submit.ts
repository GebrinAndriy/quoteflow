import { startTransition, useActionState, type FormEvent } from "react";

// Not <form action>: React resets the form after an action, wiping typed values and checkboxes.
export function useFormSubmit<State>(
  action: (state: Awaited<State>, formData: FormData) => State | Promise<State>,
  initialState: Awaited<State>,
) {
  const [state, formAction, pending] = useActionState(action, initialState);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return { state, onSubmit, pending };
}
