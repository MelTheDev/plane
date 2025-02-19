import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// ui
import { Loader } from "@plane/ui";
// hooks
import { EUserProjectRoles, PROJECT_SETTINGS_LINKS } from "constants/project";
import { useUser } from "hooks/store";
// constants

export const ProjectSettingsSidebar = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // mobx store
  const {
    membership: { currentProjectRole },
  } = useUser();

  const projectMemberInfo = currentProjectRole || EUserProjectRoles.GUEST;

  if (!currentProjectRole) {
    return (
      <div className="flex w-80 flex-col gap-6 px-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-custom-sidebar-text-400">SETTINGS</span>
          <Loader className="flex w-full flex-col gap-2">
            {[...Array(8)].map((index) => (
              <Loader.Item key={index} height="34px" />
            ))}
          </Loader>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-80 flex-col gap-6 px-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-custom-sidebar-text-400">SETTINGS</span>
        <div className="flex w-full flex-col gap-1">
          {PROJECT_SETTINGS_LINKS.map(
            (link) =>
              projectMemberInfo >= link.access && (
                <Link key={link.key} href={`/${workspaceSlug}/projects/${projectId}${link.href}`}>
                  <div
                    className={`rounded-md px-4 py-2 text-sm font-medium ${
                      link.highlight(router.asPath, `/${workspaceSlug}/projects/${projectId}`)
                        ? "bg-custom-primary-100/10 text-custom-primary-100"
                        : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                    }`}
                  >
                    {link.label}
                  </div>
                </Link>
              )
          )}
        </div>
      </div>
    </div>
  );
};
