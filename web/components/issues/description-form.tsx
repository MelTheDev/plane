import { ChangeEvent, FC, useCallback, useEffect, useState } from "react";
import { RichReadOnlyEditor, RichTextEditor } from "@plane/rich-text-editor";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// hooks
import { Loader, TextArea } from "@plane/ui";
import { useMention, useWorkspace } from "hooks/store";
import useReloadConfirmations from "hooks/use-reload-confirmation";
// components
// types
import { FileService } from "services/file.service";
import { TIssue } from "@plane/types";
import { TIssueOperations } from "./issue-detail";
// services

export interface IssueDescriptionFormValues {
  name: string;
  description_html: string;
}

export interface IssueDetailsProps {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issue: {
    name: string;
    description_html: string;
    id: string;
    project_id?: string;
  };
  issueOperations: TIssueOperations;
  disabled: boolean;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
}

const fileService = new FileService();

export const IssueDescriptionForm: FC<IssueDetailsProps> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issue, issueOperations, disabled, isSubmitting, setIsSubmitting } = props;
  const workspaceStore = useWorkspace();
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug)?.id as string;
  // states
  const [characterLimit, setCharacterLimit] = useState(false);
  // hooks
  const { setShowAlert } = useReloadConfirmations();
  // store hooks
  const { mentionHighlights, mentionSuggestions } = useMention();
  // form info
  const {
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<TIssue>({
    defaultValues: {
      name: issue?.name,
      description_html: issue?.description_html,
    },
  });

  const [localTitleValue, setLocalTitleValue] = useState("");
  const [localIssueDescription, setLocalIssueDescription] = useState({
    id: issue.id,
    description_html: issue.description_html,
  });

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<TIssue>) => {
      if (!formData?.name || formData?.name.length === 0 || formData?.name.length > 255) return;

      await issueOperations.update(workspaceSlug, projectId, issueId, {
        name: formData.name ?? "",
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [workspaceSlug, projectId, issueId, issueOperations]
  );

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 2000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  // reset form values
  useEffect(() => {
    if (!issue) return;

    reset({
      ...issue,
    });
    setLocalIssueDescription({
      id: issue.id,
      description_html: issue.description_html === "" ? "<p></p>" : issue.description_html,
    });
    setLocalTitleValue(issue.name);
  }, [issue, issue.description_html, reset]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit]
  );

  return (
    <div className="relative">
      <div className="relative">
        {!disabled ? (
          <Controller
            name="name"
            control={control}
            render={({ field: { onChange } }) => (
              <TextArea
                value={localTitleValue}
                id="name"
                name="name"
                placeholder="Enter issue name"
                onFocus={() => setCharacterLimit(true)}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setCharacterLimit(false);
                  setIsSubmitting("submitting");
                  setLocalTitleValue(e.target.value);
                  onChange(e.target.value);
                  debouncedFormSave();
                }}
                required
                className="block min-h-min w-full resize-none overflow-hidden rounded border-none bg-transparent px-3 py-2 text-2xl font-medium outline-none ring-0 focus:ring-1 focus:ring-custom-primary"
                hasError={Boolean(errors?.name)}
                role="textbox"
              />
            )}
          />
        ) : (
          <h4 className="break-words text-2xl font-semibold">{issue.name}</h4>
        )}
        {characterLimit && !disabled && (
          <div className="pointer-events-none absolute bottom-1 right-1 z-[2] rounded bg-custom-background-100 p-0.5 text-xs text-custom-text-200">
            <span className={`${watch("name").length === 0 || watch("name").length > 255 ? "text-red-500" : ""}`}>
              {watch("name").length}
            </span>
            /255
          </div>
        )}
      </div>
      <span>{errors.name ? errors.name.message : null}</span>
      <div className="relative">
        {localIssueDescription.description_html ? (
          <Controller
            name="description_html"
            control={control}
            render={({ field: { onChange } }) =>
              !disabled ? (
                <RichTextEditor
                  cancelUploadImage={fileService.cancelUpload}
                  uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
                  deleteFile={fileService.getDeleteImageFunction(workspaceId)}
                  restoreFile={fileService.getRestoreImageFunction(workspaceId)}
                  value={localIssueDescription.description_html}
                  rerenderOnPropsChange={localIssueDescription}
                  setShouldShowAlert={setShowAlert}
                  setIsSubmitting={setIsSubmitting}
                  dragDropEnabled
                  customClassName="min-h-[150px] shadow-sm"
                  onChange={(description: any, description_html: string) => {
                    setShowAlert(true);
                    setIsSubmitting("submitting");
                    onChange(description_html);
                    debouncedFormSave();
                  }}
                  mentionSuggestions={mentionSuggestions}
                  mentionHighlights={mentionHighlights}
                />
              ) : (
                <RichReadOnlyEditor
                  value={localIssueDescription.description_html}
                  customClassName="!p-0 !pt-2 text-custom-text-200"
                  noBorder={disabled}
                  mentionHighlights={mentionHighlights}
                />
              )
            }
          />
        ) : (
          <Loader>
            <Loader.Item height="150px" />
          </Loader>
        )}
      </div>
    </div>
  );
});
