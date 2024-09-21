"use client";

import { useState } from "react";
import { useForm, Controller, useFormContext } from "react-hook-form";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import {
  DropdownActions,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  Form,
  TextField,
  SelectField,
  showToast,
  Badge,
  Switch,
  InfoBadge,
} from "@calcom/ui";

interface DelegationItemProps {
  delegation: {
    id: string;
    domain: string;
    serviceAccountClientId: string;
    workspacePlatform: {
      name: string;
      slug: string;
    };
  };
  onEdit: (delegation: DelegationItemProps["delegation"]) => void;
  onDelete: (id: string) => void;
}

type WorkspacePlatform = {
  id: number;
  name: string;
  slug: string;
};

function getWorkspacePlatformOptions(workspacePlatforms: WorkspacePlatform[]) {
  return workspacePlatforms.map((platform) => ({
    value: platform.slug,
    label: platform.name,
  }));
}

function DelegationListItemActions({
  delegation,
  onEdit,
  onDelete,
}: {
  delegation: DelegationItemProps["delegation"];
  onEdit: (delegation: DelegationItemProps["delegation"]) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex items-center space-x-2">
      <DropdownActions
        actions={[
          {
            id: "edit",
            label: t("edit"),
            onClick: () => onEdit(delegation),
            icon: "pencil",
          },
          {
            id: "delete",
            label: t("delete"),
            onClick: () => onDelete(delegation.id),
            icon: "trash",
          },
        ]}
      />
    </div>
  );
}

function DelegationListItem({ delegation, onEdit, onDelete }: DelegationItemProps) {
  const { t } = useLocale();
  return (
    <li className="border-subtle bg-default divide-subtle flex flex-col divide-y rounded-lg border">
      <div className="flex items-center justify-between space-x-2 p-4">
        <div className="flex flex-col items-start">
          <div className="flex items-center space-x-2">
            <span>{delegation.serviceAccountClientId}</span>
            <InfoBadge content={t("add_client_id_in_google_workspace_with_below_scope")} />
          </div>
          <span className="text-muted mt-2">https://www.googleapis.com/auth/calendar</span>
          <div className="mt-2 flex items-center space-x-2">
            <Badge variant="default">{delegation.workspacePlatform.name}</Badge>
            <Badge variant="gray">{delegation.domain}</Badge>
          </div>
        </div>
        <DelegationListItemActions
          delegation={delegation}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </li>
  );
}

function CreateDelegationDialog({
  isOpen,
  onClose,
  onSubmit,
  workspacePlatforms,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { domain: string; workspacePlatformSlug: string;}) => void;
  workspacePlatforms: WorkspacePlatform[];
}) {
  const { t } = useLocale();

  const form = useForm<{ domain: string; workspacePlatformSlug: string; }>({
    defaultValues: {
      domain: "",
      workspacePlatformSlug: "",
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent title={t("add_domain_wide_delegation")}>
        <Form form={form} handleSubmit={onSubmit}>
          <DelegationFormFields workspacePlatforms={workspacePlatforms} />
          <DialogFooter>
            <Button type="button" color="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("create")}</Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditDelegationDialog({
  isOpen,
  onClose,
  delegation,
  onSubmit,
  workspacePlatforms,
}: {
  isOpen: boolean;
  onClose: () => void;
  delegation: DelegationItemProps["delegation"];
  onSubmit: (data: { domain: string; workspacePlatformSlug: string; }) => void;
  workspacePlatforms: WorkspacePlatform[];
}) {
  const { t } = useLocale();

  const form = useForm<{ domain: string; workspacePlatformSlug: string;}>({
    defaultValues: {
      domain: delegation.domain,
      workspacePlatformSlug: delegation.workspacePlatform.slug,
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent title={t("edit_domain_wide_delegation")}>
        <Form form={form} handleSubmit={onSubmit}>
          <DelegationFormFields workspacePlatforms={workspacePlatforms} />
          <DialogFooter>
            <Button type="button" color="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("update")}</Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DelegationFormFields({ workspacePlatforms }: { workspacePlatforms: WorkspacePlatform[] }) {
  const { t } = useLocale();
  const form = useFormContext();
  return (
    <>
      <TextField label={t("domain")} {...form.register("domain")} />
      <Controller
        name="workspacePlatformSlug"
        control={form.control}
        render={({ field: { value, onChange } }) => {
          const platformOptions = getWorkspacePlatformOptions(workspacePlatforms);
          const selectedPlatform = platformOptions.find((opt) => opt.value === value);
          return (
            <SelectField
              label={t("workspace_platform")}
              onChange={(option) => onChange(option?.value)}
              value={selectedPlatform}
              options={platformOptions}
            />
          );
        }}
      />
    </>
  );
}

function CreateEditDelegationDialog({
  isOpen,
  onClose,
  delegation,
  onSubmit,
  workspacePlatforms,
}: {
  isOpen: boolean;
  onClose: () => void;
  delegation: DelegationItemProps["delegation"] | null;
  onSubmit: (data: { domain: string; workspacePlatformSlug: string;  }) => void;
  workspacePlatforms: WorkspacePlatform[];
}) {
  if (delegation) {
    return (
      <EditDelegationDialog
        isOpen={isOpen}
        onClose={onClose}
        delegation={delegation}
        onSubmit={onSubmit}
        workspacePlatforms={workspacePlatforms}
      />
    );
  }
  return (
    <CreateDelegationDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      workspacePlatforms={workspacePlatforms}
    />
  );
}

function DomainWideDelegationList() {
  const { t } = useLocale();
  const utils = trpc.useContext();
  const { data: delegations, isLoading } = trpc.viewer.domainWideDelegation.list.useQuery();

  const updateMutation = trpc.viewer.domainWideDelegation.update.useMutation({
    onSuccess: () => utils.viewer.domainWideDelegation.list.invalidate(),
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  const createMutation = trpc.viewer.domainWideDelegation.add.useMutation({
    onSuccess: () => utils.viewer.domainWideDelegation.list.invalidate(),
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  const deleteMutation = trpc.viewer.domainWideDelegation.delete.useMutation({
    onSuccess: () => utils.viewer.domainWideDelegation.list.invalidate(),
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  const onDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const [createEditDialog, setCreateEditDialog] = useState<{
    isOpen: boolean;
    delegation: DelegationItemProps["delegation"] | null;
  }>({
    isOpen: false,
    delegation: null,
  });

  const { data: workspacePlatforms, isLoading: isLoadingWorkspacePlatforms } =
    trpc.viewer.domainWideDelegation.listWorkspacePlatforms.useQuery();

  const onEditClick = (delegation: DelegationItemProps["delegation"]) => {
    setCreateEditDialog({ isOpen: true, delegation });
  };

  const onCreateClick = () => setCreateEditDialog({ isOpen: true, delegation: null });

  const handleSubmit = (data: { domain: string; workspacePlatformSlug: string;  }) => {
    if (createEditDialog.delegation) {
      updateMutation.mutate({
        id: createEditDialog.delegation.id,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
    setCreateEditDialog({ isOpen: false, delegation: null });
  };

  if (isLoading || isLoadingWorkspacePlatforms) {
    return null;
  }

  if (!delegations || !workspacePlatforms) {
    return <div>{t("something_went_wrong")}</div>;
  }

  return (
    <div>
      <ul className="space-y-2">
        {delegations.map((delegation) => (
          <DelegationListItem
            key={delegation.id}
            delegation={delegation}
            onEdit={onEditClick}
            onDelete={onDelete}
          />
        ))}
      </ul>
      <CreateEditDelegationDialog
        isOpen={createEditDialog.isOpen}
        onClose={() => setCreateEditDialog({ isOpen: false, delegation: null })}
        delegation={createEditDialog.delegation}
        onSubmit={handleSubmit}
        workspacePlatforms={workspacePlatforms}
      />
      <Button type="button" color="secondary" StartIcon="plus" className="mt-6" onClick={onCreateClick}>
        {t("add_domain_wide_delegation")}
      </Button>
    </div>
  );
}

export default function DomainWideDelegationListPage() {
  return (
    <div className="py-8">
      <DomainWideDelegationList />
    </div>
  );
}
