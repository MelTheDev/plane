import { makeObservable } from "mobx";
// services
import { computedFn } from "mobx-utils";
import { IssueArchiveService, IssueDraftService, IssueService } from "services/issue";
// types
import { TIssue } from "@plane/types";
import { IIssueDetail } from "./root.store";

export interface IIssueStoreActions {
  // actions
  fetchIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    issueType?: "DEFAULT" | "DRAFT" | "ARCHIVED"
  ) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  addModulesToIssue: (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => Promise<any>;
  removeModulesFromIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleIds: string[]
  ) => Promise<void>;
  removeIssueFromModule: (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => Promise<void>;
}

export interface IIssueStore extends IIssueStoreActions {
  // helper methods
  getIssueById: (issueId: string) => TIssue | undefined;
}

export class IssueStore implements IIssueStore {
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;
  issueArchiveService;
  issueDraftService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {});
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService();
    this.issueArchiveService = new IssueArchiveService();
    this.issueDraftService = new IssueDraftService();
  }

  // helper methods
  getIssueById = computedFn((issueId: string) => {
    if (!issueId) return undefined;
    return this.rootIssueDetailStore.rootIssueStore.issues.getIssueById(issueId) ?? undefined;
  });

  // actions
  fetchIssue = async (workspaceSlug: string, projectId: string, issueId: string, issueType = "DEFAULT") => {
    try {
      const query = {
        expand: "issue_reactions,issue_attachment,issue_link,parent",
      };

      let issue: TIssue;
      let issuePayload: TIssue;

      if (issueType === "ARCHIVED")
        issue = await this.issueArchiveService.retrieveArchivedIssue(workspaceSlug, projectId, issueId, query);
      else if (issueType === "DRAFT")
        issue = await this.issueDraftService.getDraftIssueById(workspaceSlug, projectId, issueId, query);
      else issue = await this.issueService.retrieve(workspaceSlug, projectId, issueId, query);

      if (!issue) throw new Error("Issue not found");

      issuePayload = {
        id: issue?.id,
        sequence_id: issue?.sequence_id,
        name: issue?.name,
        description_html: issue?.description_html,
        sort_order: issue?.sort_order,
        state_id: issue?.state_id,
        priority: issue?.priority,
        label_ids: issue?.label_ids,
        assignee_ids: issue?.assignee_ids,
        estimate_point: issue?.estimate_point,
        sub_issues_count: issue?.sub_issues_count,
        attachment_count: issue?.attachment_count,
        link_count: issue?.link_count,
        project_id: issue?.project_id,
        parent_id: issue?.parent_id,
        cycle_id: issue?.cycle_id,
        module_ids: issue?.module_ids,
        created_at: issue?.created_at,
        updated_at: issue?.updated_at,
        start_date: issue?.start_date,
        target_date: issue?.target_date,
        completed_at: issue?.completed_at,
        archived_at: issue?.archived_at,
        created_by: issue?.created_by,
        updated_by: issue?.updated_by,
        is_draft: issue?.is_draft,
        is_subscribed: issue?.is_subscribed,
      };

      this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issuePayload], true);

      // store handlers from issue detail
      // parent
      if (issue && issue?.parent && issue?.parent?.id)
        this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issue.parent]);
      // assignees
      // labels
      // state

      // issue reactions
      if (issue.issue_reactions) this.rootIssueDetailStore.addReactions(issueId, issue.issue_reactions);

      // fetch issue links
      if (issue.issue_link) this.rootIssueDetailStore.addLinks(issueId, issue.issue_link);

      // fetch issue attachments
      if (issue.issue_attachment) this.rootIssueDetailStore.addAttachments(issueId, issue.issue_attachment);

      this.rootIssueDetailStore.addSubscription(issueId, issue.is_subscribed);

      // fetch issue activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);

      // fetch issue comments
      this.rootIssueDetailStore.comment.fetchComments(workspaceSlug, projectId, issueId);

      // fetch sub issues
      this.rootIssueDetailStore.subIssues.fetchSubIssues(workspaceSlug, projectId, issueId);

      // fetch issue relations
      this.rootIssueDetailStore.relation.fetchRelations(workspaceSlug, projectId, issueId);

      // fetching states
      // TODO: check if this function is required
      this.rootIssueDetailStore.rootIssueStore.state.fetchProjectStates(workspaceSlug, projectId);

      return issue;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
    await this.rootIssueDetailStore.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);
    await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.rootIssueDetailStore.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

  archiveIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.rootIssueDetailStore.rootIssueStore.projectIssues.archiveIssue(workspaceSlug, projectId, issueId);

  addIssueToCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
    await this.rootIssueDetailStore.rootIssueStore.cycleIssues.addIssueToCycle(
      workspaceSlug,
      projectId,
      cycleId,
      issueIds,
      false
    );
    if (issueIds && issueIds.length > 0)
      await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueIds[0]);
  };

  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
    const cycle = await this.rootIssueDetailStore.rootIssueStore.cycleIssues.removeIssueFromCycle(
      workspaceSlug,
      projectId,
      cycleId,
      issueId
    );
    await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return cycle;
  };

  addModulesToIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
    const _module = await this.rootIssueDetailStore.rootIssueStore.moduleIssues.addModulesToIssue(
      workspaceSlug,
      projectId,
      issueId,
      moduleIds
    );
    if (moduleIds && moduleIds.length > 0)
      await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return _module;
  };

  removeModulesFromIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
    const _module = await this.rootIssueDetailStore.rootIssueStore.moduleIssues.removeModulesFromIssue(
      workspaceSlug,
      projectId,
      issueId,
      moduleIds
    );
    await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return _module;
  };

  removeIssueFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
    const _module = await this.rootIssueDetailStore.rootIssueStore.moduleIssues.removeIssueFromModule(
      workspaceSlug,
      projectId,
      moduleId,
      issueId
    );
    await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return _module;
  };
}
