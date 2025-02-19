import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import { EmptyState } from "components/common";
import { PageHead } from "components/core";
import { ProjectViewIssuesHeader } from "components/headers";
import { ProjectViewLayoutRoot } from "components/issues";
import { useProject, useProjectView } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
// ui
// assets
import { NextPageWithLayout } from "lib/types";
import emptyView from "public/empty-state/view.svg";
// types

const ProjectViewIssuesPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;
  // store hooks
  const { fetchViewDetails, getViewById } = useProjectView();
  const { getProjectById } = useProject();
  // derived values
  const projectView = viewId ? getViewById(viewId.toString()) : undefined;
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name && projectView?.name ? `${project?.name} - ${projectView?.name}` : undefined;

  const { error } = useSWR(
    workspaceSlug && projectId && viewId ? `VIEW_DETAILS_${viewId.toString()}` : null,
    workspaceSlug && projectId && viewId
      ? () => fetchViewDetails(workspaceSlug.toString(), projectId.toString(), viewId.toString())
      : null
  );

  return (
    <>
      {error ? (
        <EmptyState
          image={emptyView}
          title="View does not exist"
          description="The view you are looking for does not exist or has been deleted."
          primaryButton={{
            text: "View other views",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/views`),
          }}
        />
      ) : (
        <>
          <PageHead title={pageTitle} />
          <ProjectViewLayoutRoot />
        </>
      )}
    </>
  );
});

ProjectViewIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectViewIssuesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectViewIssuesPage;
