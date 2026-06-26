declare module "primevue/toasteventbus" {
  const ToastEventBus: {
    emit: (event: string, data: any) => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
  };

  export default ToastEventBus;
}
