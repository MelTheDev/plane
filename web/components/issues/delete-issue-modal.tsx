import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle } from "lucide-react";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// types
import { TIssue } from "@plane/types";
// hooks
import { useIssues, useProject } from "hooks/store";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  dataId?: string | null | undefined;
  data?: TIssue;
  onSubmit?: () => Promise<void>;
};

export const DeleteIssueModal: React.FC<Props> = (props) => {
  const { dataId, data, isOpen, handleClose, onSubmit } = props;

  const { issueMap } = useIssues();

  const [isDeleting, setIsDeleting] = useState(false);

  // hooks
  const { getProjectById } = useProject();

  useEffect(() => {
    setIsDeleting(false);
  }, [isOpen]);

  if (!dataId && !data) return null;

  const issue = data ? data : issueMap[dataId!];

  const onClose = () => {
    setIsDeleting(false);
    handleClose();
  };

  const handleIssueDelete = async () => {
    setIsDeleting(true);
    if (onSubmit)
      await onSubmit()
        .then(() => {
          onClose();
        })
        .catch(() => {
          setToast({
            title: "Error",
            type: TOAST_TYPE.ERROR,
            message: "Failed to delete issue",
          });
        })
        .finally(() => setIsDeleting(false));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <div className="grid place-items-center rounded-full bg-red-500/20 p-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Issue</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm text-custom-text-200">
                      Are you sure you want to delete issue{" "}
                      <span className="break-words font-medium text-custom-text-100">
                        {getProjectById(issue?.project_id)?.identifier}-{issue?.sequence_id}
                      </span>
                      {""}? All of the data related to the issue will be permanently removed. This action cannot be
                      undone.
                    </p>
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" tabIndex={1} onClick={handleIssueDelete} loading={isDeleting}>
                      {isDeleting ? "Deleting" : "Delete"}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
